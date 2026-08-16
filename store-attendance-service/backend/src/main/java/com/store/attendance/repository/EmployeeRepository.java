package com.store.attendance.repository;

import com.store.attendance.domain.Employee;
import com.store.attendance.domain.EmployeeRole;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface EmployeeRepository extends ReactiveCrudRepository<Employee, UUID> {

    Mono<Employee> findByStoreIdAndUsernameIgnoreCase(UUID storeId, String username);

    Flux<Employee> findByStoreId(UUID storeId);

    Flux<Employee> findByStoreIdAndManagerId(UUID storeId, UUID managerId);

    Flux<Employee> findByStoreIdAndRole(UUID storeId, EmployeeRole role);

    Flux<Employee> findByStoreIdIn(java.util.Collection<UUID> storeIds);
}
