package com.store.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("stores")
public class Store implements Persistable<UUID> {

    @Id
    private UUID id;
    private String code;
    private String name;
    private Instant createdAt;

    @Transient
    private boolean newEntity = true;

    public Store() {
    }

    public static Store create(String code, String name) {
        Store store = new Store();
        store.id = UUID.randomUUID();
        store.code = code;
        store.name = name;
        store.createdAt = Instant.now();
        store.newEntity = true;
        return store;
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

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
