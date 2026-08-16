package com.store.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.util.UUID;

@Table("employees")
public class Employee implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID storeId;
    private String username;
    private String passwordHash;
    private String fullName;
    private EmployeeRole role;
    private UUID managerId;
    private EmployeeStatus status;
    private Instant terminatedAt;
    private Instant createdAt;

    @Transient
    private boolean newEntity = true;

    public Employee() {
    }

    public static Employee create(
            UUID storeId,
            String username,
            String passwordHash,
            String fullName,
            EmployeeRole role,
            UUID managerId
    ) {
        Employee employee = new Employee();
        employee.id = UUID.randomUUID();
        employee.storeId = storeId;
        employee.username = username;
        employee.passwordHash = passwordHash;
        employee.fullName = fullName;
        employee.role = role;
        employee.managerId = managerId;
        employee.status = EmployeeStatus.ACTIVE;
        employee.createdAt = Instant.now();
        employee.newEntity = true;
        return employee;
    }

    public void terminate(Instant at) {
        this.status = EmployeeStatus.TERMINATED;
        this.terminatedAt = at;
        this.newEntity = false;
    }

    public boolean isActive() {
        return status == EmployeeStatus.ACTIVE;
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

    public UUID getStoreId() {
        return storeId;
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

    public EmployeeRole getRole() {
        return role;
    }

    public UUID getManagerId() {
        return managerId;
    }

    public EmployeeStatus getStatus() {
        return status;
    }

    public Instant getTerminatedAt() {
        return terminatedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
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

    public void setRole(EmployeeRole role) {
        this.role = role;
    }

    public void setManagerId(UUID managerId) {
        this.managerId = managerId;
    }

    public void setStatus(EmployeeStatus status) {
        this.status = status;
    }

    public void setTerminatedAt(Instant terminatedAt) {
        this.terminatedAt = terminatedAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }
}
