package com.store.attendance.repository;

import com.store.attendance.domain.Owner;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface OwnerRepository extends ReactiveCrudRepository<Owner, UUID> {

    Mono<Owner> findByUsernameIgnoreCase(String username);
}
