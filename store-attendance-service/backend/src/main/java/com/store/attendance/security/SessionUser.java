package com.store.attendance.security;

import com.store.attendance.domain.ActorType;

import java.util.UUID;

public record SessionUser(
        ActorType type,
        UUID ownerId,
        UUID employeeId,
        UUID storeId,
        String fullName,
        String username
) {
    public static SessionUser owner(UUID ownerId, String fullName, String username) {
        return new SessionUser(ActorType.OWNER, ownerId, null, null, fullName, username);
    }

    public static SessionUser staff(ActorType type, UUID employeeId, UUID storeId, String fullName, String username) {
        return new SessionUser(type, null, employeeId, storeId, fullName, username);
    }

    public boolean isOwner() {
        return type == ActorType.OWNER;
    }

    public boolean isManager() {
        return type == ActorType.MANAGER;
    }

    public boolean isStaff() {
        return type == ActorType.MANAGER || type == ActorType.EMPLOYEE;
    }
}
