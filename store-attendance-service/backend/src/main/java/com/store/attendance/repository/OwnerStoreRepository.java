package com.store.attendance.repository;

import com.store.attendance.domain.OwnerStore;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.UUID;

public interface OwnerStoreRepository extends ReactiveCrudRepository<OwnerStore, UUID> {

    Flux<OwnerStore> findByOwnerId(UUID ownerId);

    Mono<Boolean> existsByOwnerIdAndStoreId(UUID ownerId, UUID storeId);
}
