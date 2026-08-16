package com.store.attendance.web.dto;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record TimecardEntry(
        UUID id,
        Instant checkInAt,
        Instant checkOutAt,
        LocalDate workDate,
        boolean open,
        double hours
) {
}
