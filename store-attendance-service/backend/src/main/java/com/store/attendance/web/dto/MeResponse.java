package com.store.attendance.web.dto;

import com.store.attendance.domain.ActorType;

import java.util.List;
import java.util.UUID;

public record MeResponse(
        ActorType role,
        String username,
        String fullName,
        UUID storeId,
        String storeCode,
        String storeName,
        UUID employeeId,
        List<StoreSummary> stores,
        boolean checkedIn
) {
}
