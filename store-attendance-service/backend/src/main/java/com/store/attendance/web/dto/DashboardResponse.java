package com.store.attendance.web.dto;

import java.time.LocalDate;
import java.util.List;

public record DashboardResponse(
        LocalDate from,
        LocalDate to,
        boolean cumulative,
        StoreKpi totals,
        List<StoreKpi> storeSummaries,
        List<EmployeeAttendanceRow> employees
) {
}
