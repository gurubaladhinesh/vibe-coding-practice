package com.store.attendance.service;

import com.store.attendance.domain.Employee;
import com.store.attendance.domain.EmployeeRole;
import com.store.attendance.repository.EmployeeRepository;
import com.store.attendance.security.SessionUser;
import com.store.attendance.web.dto.EmployeeResponse;
import com.store.attendance.web.dto.OnboardEmployeeRequest;
import com.store.attendance.web.error.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.UUID;

@Service
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final AuthService authService;
    private final PasswordEncoder passwordEncoder;

    public EmployeeService(
            EmployeeRepository employeeRepository,
            AuthService authService,
            PasswordEncoder passwordEncoder
    ) {
        this.employeeRepository = employeeRepository;
        this.authService = authService;
        this.passwordEncoder = passwordEncoder;
    }

    public Mono<EmployeeResponse> onboard(SessionUser actor, OnboardEmployeeRequest request) {
        if (actor.isOwner()) {
            if (request.storeId() == null) {
                return Mono.error(ApiException.badRequest("storeId is required for owner onboarding"));
            }
            return authService.assertOwnsStore(actor.ownerId(), request.storeId())
                    .then(createEmployee(request.storeId(), request, true, null));
        }
        if (actor.isManager()) {
            if (request.role() != EmployeeRole.EMPLOYEE) {
                return Mono.error(ApiException.forbidden("Managers can only onboard employees"));
            }
            return createEmployee(actor.storeId(), request, false, actor.employeeId());
        }
        return Mono.error(ApiException.forbidden("Employees cannot onboard staff"));
    }

    public Flux<EmployeeResponse> list(SessionUser actor, UUID storeId) {
        if (actor.isOwner()) {
            UUID target = storeId;
            if (target == null) {
                return Flux.error(ApiException.badRequest("storeId is required"));
            }
            return authService.assertOwnsStore(actor.ownerId(), target)
                    .thenMany(employeeRepository.findByStoreId(target))
                    .map(this::toResponse);
        }
        if (actor.isManager()) {
            return employeeRepository.findByStoreIdAndManagerId(actor.storeId(), actor.employeeId())
                    .concatWith(employeeRepository.findById(actor.employeeId()))
                    .map(this::toResponse);
        }
        return employeeRepository.findById(actor.employeeId()).map(this::toResponse).flux();
    }

    public Mono<EmployeeResponse> terminate(SessionUser actor, UUID employeeId) {
        if (!actor.isOwner()) {
            return Mono.error(ApiException.forbidden("Only an owner can terminate employees"));
        }
        return employeeRepository.findById(employeeId)
                .switchIfEmpty(Mono.error(ApiException.notFound("Employee not found")))
                .flatMap(employee -> authService.assertOwnsStore(actor.ownerId(), employee.getStoreId())
                        .then(Mono.defer(() -> {
                            if (employee.getRole() == EmployeeRole.MANAGER) {
                                return employeeRepository.findByStoreIdAndManagerId(employee.getStoreId(), employee.getId())
                                        .filter(Employee::isActive)
                                        .hasElements()
                                        .flatMap(hasActiveReports -> hasActiveReports
                                                ? Mono.error(ApiException.conflict("Reassign or terminate reporting employees first"))
                                                : persistTermination(employee));
                            }
                            return persistTermination(employee);
                        })));
    }

    private Mono<EmployeeResponse> persistTermination(Employee employee) {
        employee.terminate(Instant.now());
        return employeeRepository.save(employee).map(this::toResponse);
    }

    private Mono<EmployeeResponse> createEmployee(
            UUID storeId,
            OnboardEmployeeRequest request,
            boolean asOwner,
            UUID actingManagerId
    ) {
        UUID managerId;
        if (request.role() == EmployeeRole.MANAGER) {
            if (!asOwner) {
                return Mono.error(ApiException.forbidden("Only an owner can onboard managers"));
            }
            managerId = null;
        } else {
            managerId = request.managerId() != null ? request.managerId() : actingManagerId;
            if (managerId == null) {
                return Mono.error(ApiException.badRequest("managerId is required for employees"));
            }
        }

        Mono<Void> managerCheck = request.role() == EmployeeRole.EMPLOYEE
                ? employeeRepository.findById(managerId)
                .switchIfEmpty(Mono.error(ApiException.badRequest("Manager not found")))
                .flatMap(manager -> {
                    if (!manager.getStoreId().equals(storeId) || manager.getRole() != EmployeeRole.MANAGER || !manager.isActive()) {
                        return Mono.error(ApiException.badRequest("Manager must be an active manager in the same store"));
                    }
                    return Mono.empty();
                })
                : Mono.empty();

        return managerCheck.then(employeeRepository.findByStoreIdAndUsernameIgnoreCase(storeId, request.username().trim())
                .flatMap(existing -> Mono.<Employee>error(ApiException.conflict("Username already exists in this store")))
                .switchIfEmpty(Mono.defer(() -> {
                    Employee employee = Employee.create(
                            storeId,
                            request.username().trim(),
                            passwordEncoder.encode(request.password()),
                            request.fullName().trim(),
                            request.role(),
                            managerId
                    );
                    return employeeRepository.save(employee);
                }))
                .map(this::toResponse));
    }

    public EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getStoreId(),
                employee.getUsername(),
                employee.getFullName(),
                employee.getRole(),
                employee.getManagerId(),
                employee.getStatus(),
                employee.getTerminatedAt()
        );
    }
}
