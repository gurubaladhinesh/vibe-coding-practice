package com.store.attendance.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record AttendanceResponse(
        UUID id,
        UUID employeeId,
        UUID storeId,
        Instant checkInAt,
        Instant checkOutAt,
        LocalDate workDate,
        boolean open
) {
}
