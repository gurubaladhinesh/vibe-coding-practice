package com.store.attendance.web.dto;

import java.util.UUID;

public record StoreKpi(
        UUID storeId,
        String storeCode,
        String storeName,
        long employeeCount,
        long currentlyCheckedIn,
        double totalHours,
        double avgHours
) {
}
