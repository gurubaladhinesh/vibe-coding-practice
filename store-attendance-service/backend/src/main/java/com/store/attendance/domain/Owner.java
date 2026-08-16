package com.store.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("owners")
public class Owner implements Persistable<UUID> {

    @Id
    private UUID id;
    private String username;
    private String passwordHash;
    private String fullName;
    private Instant createdAt;

    @Transient
    private boolean newEntity = true;

    public Owner() {
    }

    public static Owner create(String username, String passwordHash, String fullName) {
        Owner owner = new Owner();
        owner.id = UUID.randomUUID();
        owner.username = username;
        owner.passwordHash = passwordHash;
        owner.fullName = fullName;
        owner.createdAt = Instant.now();
        owner.newEntity = true;
        return owner;
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

    public String getUsername() {
        return username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public String getFullName() {
        return fullName;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
