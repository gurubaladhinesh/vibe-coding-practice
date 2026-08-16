package com.store.attendance.service;

import com.store.attendance.domain.ActorType;
import com.store.attendance.domain.Employee;
import com.store.attendance.domain.EmployeeStatus;
import com.store.attendance.domain.Owner;
import com.store.attendance.domain.Store;
import com.store.attendance.repository.AttendanceEntryRepository;
import com.store.attendance.repository.EmployeeRepository;
import com.store.attendance.repository.OwnerRepository;
import com.store.attendance.repository.OwnerStoreRepository;
import com.store.attendance.repository.StoreRepository;
import com.store.attendance.security.SessionUser;
import com.store.attendance.web.dto.MeResponse;
import com.store.attendance.web.dto.StoreSummary;
import com.store.attendance.web.error.ApiException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final OwnerRepository ownerRepository;
    private final EmployeeRepository employeeRepository;
    private final StoreRepository storeRepository;
    private final OwnerStoreRepository ownerStoreRepository;
    private final AttendanceEntryRepository attendanceEntryRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(
            OwnerRepository ownerRepository,
            EmployeeRepository employeeRepository,
            StoreRepository storeRepository,
            OwnerStoreRepository ownerStoreRepository,
            AttendanceEntryRepository attendanceEntryRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.ownerRepository = ownerRepository;
        this.employeeRepository = employeeRepository;
        this.storeRepository = storeRepository;
        this.ownerStoreRepository = ownerStoreRepository;
        this.attendanceEntryRepository = attendanceEntryRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Mono<SessionUser> login(String storeCode, String username, String password) {
        if (!StringUtils.hasText(storeCode)) {
            return loginOwner(username, password);
        }
        return loginStaff(storeCode.trim(), username, password);
    }

    public Mono<MeResponse> me(SessionUser user) {
        if (user.isOwner()) {
            return ownerStores(user.ownerId())
                    .map(stores -> new MeResponse(
                            ActorType.OWNER,
                            user.username(),
                            user.fullName(),
                            null,
                            null,
                            null,
                            null,
                            stores,
                            false
                    ));
        }
        return Mono.zip(
                storeRepository.findById(user.storeId()),
                attendanceEntryRepository.findByEmployeeIdAndCheckOutAtIsNull(user.employeeId())
                        .map(entry -> true)
                        .defaultIfEmpty(false)
        ).map(tuple -> {
            Store store = tuple.getT1();
            boolean checkedIn = tuple.getT2();
            return new MeResponse(
                    user.type(),
                    user.username(),
                    user.fullName(),
                    store.getId(),
                    store.getCode(),
                    store.getName(),
                    user.employeeId(),
                    List.of(new StoreSummary(store.getId(), store.getCode(), store.getName())),
                    checkedIn
            );
        });
    }

    public Mono<List<StoreSummary>> ownerStores(UUID ownerId) {
        return ownerStoreRepository.findByOwnerId(ownerId)
                .flatMap(link -> storeRepository.findById(link.getStoreId()))
                .map(store -> new StoreSummary(store.getId(), store.getCode(), store.getName()))
                .collectList();
    }

    public Mono<Void> assertOwnsStore(UUID ownerId, UUID storeId) {
        return ownerStoreRepository.existsByOwnerIdAndStoreId(ownerId, storeId)
                .flatMap(owns -> owns
                        ? Mono.empty()
                        : Mono.error(ApiException.forbidden("Store is not owned by this account")));
    }

    private Mono<SessionUser> loginOwner(String username, String password) {
        return ownerRepository.findByUsernameIgnoreCase(username.trim())
                .switchIfEmpty(Mono.error(ApiException.unauthorized("Invalid credentials")))
                .flatMap(owner -> verifyPassword(owner, password));
    }

    private Mono<SessionUser> verifyPassword(Owner owner, String password) {
        if (!passwordEncoder.matches(password, owner.getPasswordHash())) {
            return Mono.error(ApiException.unauthorized("Invalid credentials"));
        }
        return Mono.just(SessionUser.owner(owner.getId(), owner.getFullName(), owner.getUsername()));
    }

    private Mono<SessionUser> loginStaff(String storeCode, String username, String password) {
        return storeRepository.findByCodeIgnoreCase(storeCode)
                .switchIfEmpty(Mono.error(ApiException.unauthorized("Invalid credentials")))
                .flatMap(store -> employeeRepository.findByStoreIdAndUsernameIgnoreCase(store.getId(), username.trim())
                        .switchIfEmpty(Mono.error(ApiException.unauthorized("Invalid credentials")))
                        .flatMap(employee -> toStaffSession(store, employee, password)));
    }

    private Mono<SessionUser> toStaffSession(Store store, Employee employee, String password) {
        if (employee.getStatus() == EmployeeStatus.TERMINATED) {
            return Mono.error(ApiException.unauthorized("Account has been terminated"));
        }
        if (!passwordEncoder.matches(password, employee.getPasswordHash())) {
            return Mono.error(ApiException.unauthorized("Invalid credentials"));
        }
        ActorType type = ActorType.valueOf(employee.getRole().name());
        return Mono.just(SessionUser.staff(type, employee.getId(), store.getId(), employee.getFullName(), employee.getUsername()));
    }

    public Flux<Store> storesForOwner(UUID ownerId) {
        return ownerStoreRepository.findByOwnerId(ownerId)
                .flatMap(link -> storeRepository.findById(link.getStoreId()));
    }
}
