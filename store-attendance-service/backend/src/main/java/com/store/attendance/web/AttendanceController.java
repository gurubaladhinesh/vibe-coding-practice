package com.store.attendance.web;

import com.store.attendance.security.CurrentUser;
import com.store.attendance.service.AttendanceService;
import com.store.attendance.service.DashboardService;
import com.store.attendance.web.dto.AttendanceResponse;
import com.store.attendance.web.dto.DashboardResponse;
import com.store.attendance.web.dto.TimecardResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final DashboardService dashboardService;

    public AttendanceController(AttendanceService attendanceService, DashboardService dashboardService) {
        this.attendanceService = attendanceService;
        this.dashboardService = dashboardService;
    }

    @PostMapping("/check-in")
    public Mono<AttendanceResponse> checkIn() {
        return CurrentUser.require().flatMap(attendanceService::checkIn);
    }

    @PostMapping("/check-out")
    public Mono<AttendanceResponse> checkOut() {
        return CurrentUser.require().flatMap(attendanceService::checkOut);
    }

    @GetMapping("/dashboard")
    public Mono<DashboardResponse> dashboard(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) UUID storeId
    ) {
        return CurrentUser.require().flatMap(user -> dashboardService.dashboard(user, from, to, storeId));
    }

    @GetMapping("/timecard")
    public Mono<TimecardResponse> timecard(
            @RequestParam(required = false) LocalDate from,
            @RequestParam(required = false) LocalDate to,
            @RequestParam(required = false) UUID employeeId
    ) {
        return CurrentUser.require().flatMap(user -> dashboardService.timecard(user, from, to, employeeId));
    }
}
