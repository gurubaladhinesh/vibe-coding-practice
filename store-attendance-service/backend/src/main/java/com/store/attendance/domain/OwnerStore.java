package com.store.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.util.UUID;

@Table("owner_stores")
public class OwnerStore implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID ownerId;
    private UUID storeId;

    @Transient
    private boolean newEntity = true;

    public OwnerStore() {
    }

    public static OwnerStore link(UUID ownerId, UUID storeId) {
        OwnerStore link = new OwnerStore();
        link.id = UUID.randomUUID();
        link.ownerId = ownerId;
        link.storeId = storeId;
        link.newEntity = true;
        return link;
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return newEntity;
    }

    public void markPersisted() {
        this.newEntity = false;
    }

    public UUID getOwnerId() {
        return ownerId;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setOwnerId(UUID ownerId) {
        this.ownerId = ownerId;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
    }
}
