package com.store.attendance.repository;

import com.store.attendance.domain.Store;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface StoreRepository extends ReactiveCrudRepository<Store, UUID> {

    Mono<Store> findByCodeIgnoreCase(String code);
}
