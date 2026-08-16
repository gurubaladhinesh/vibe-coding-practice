package com.store.attendance.web.dto;

import com.store.attendance.domain.EmployeeRole;
import com.store.attendance.domain.EmployeeStatus;

import java.time.Instant;
import java.util.UUID;

public record EmployeeAttendanceRow(
        UUID employeeId,
        String fullName,
        String username,
        EmployeeRole role,
        EmployeeStatus status,
        String storeCode,
        String storeName,
        UUID storeId,
        double hoursWorked,
        double avgHours,
        boolean currentlyCheckedIn,
        Instant lastCheckInAt,
        Instant lastCheckOutAt
) {
}
