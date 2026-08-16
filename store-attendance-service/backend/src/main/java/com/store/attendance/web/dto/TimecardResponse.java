package com.store.attendance.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TimecardResponse(
        UUID employeeId,
        String fullName,
        String storeCode,
        String storeName,
        LocalDate from,
        LocalDate to,
        double totalHours,
        double avgHours,
        double storeAvgHours,
        List<TimecardEntry> entries
) {
}
