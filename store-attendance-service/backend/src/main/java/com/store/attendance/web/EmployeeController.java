package com.store.attendance.web;

import com.store.attendance.security.CurrentUser;
import com.store.attendance.service.EmployeeService;
import com.store.attendance.web.dto.EmployeeResponse;
import com.store.attendance.web.dto.OnboardEmployeeRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {

    private final EmployeeService employeeService;

    public EmployeeController(EmployeeService employeeService) {
        this.employeeService = employeeService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Mono<EmployeeResponse> onboard(@Valid @RequestBody OnboardEmployeeRequest request) {
        return CurrentUser.require().flatMap(user -> employeeService.onboard(user, request));
    }

    @GetMapping
    public Flux<EmployeeResponse> list(@RequestParam(required = false) UUID storeId) {
        return CurrentUser.require().flatMapMany(user -> employeeService.list(user, storeId));
    }

    @PostMapping("/{id}/terminate")
    public Mono<EmployeeResponse> terminate(@PathVariable UUID id) {
        return CurrentUser.require().flatMap(user -> employeeService.terminate(user, id));
    }
}
