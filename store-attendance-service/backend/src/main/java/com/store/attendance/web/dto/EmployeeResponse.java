package com.store.attendance.web.dto;

import com.store.attendance.domain.EmployeeRole;
import com.store.attendance.domain.EmployeeStatus;

import java.time.Instant;
import java.util.UUID;

public record EmployeeResponse(
        UUID id,
        UUID storeId,
        String username,
        String fullName,
        EmployeeRole role,
        UUID managerId,
        EmployeeStatus status,
        Instant terminatedAt
) {
}
