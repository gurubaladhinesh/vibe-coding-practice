package com.store.attendance.service;

import com.store.attendance.domain.AttendanceEntry;
import com.store.attendance.domain.Employee;
import com.store.attendance.domain.Store;
import com.store.attendance.repository.AttendanceEntryRepository;
import com.store.attendance.repository.EmployeeRepository;
import com.store.attendance.repository.StoreRepository;
import com.store.attendance.security.SessionUser;
import com.store.attendance.web.dto.DashboardResponse;
import com.store.attendance.web.dto.EmployeeAttendanceRow;
import com.store.attendance.web.dto.StoreKpi;
import com.store.attendance.web.dto.TimecardEntry;
import com.store.attendance.web.dto.TimecardResponse;
import com.store.attendance.web.error.ApiException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private final EmployeeRepository employeeRepository;
    private final AttendanceEntryRepository attendanceEntryRepository;
    private final StoreRepository storeRepository;
    private final AuthService authService;

    public DashboardService(
            EmployeeRepository employeeRepository,
            AttendanceEntryRepository attendanceEntryRepository,
            StoreRepository storeRepository,
            AuthService authService
    ) {
        this.employeeRepository = employeeRepository;
        this.attendanceEntryRepository = attendanceEntryRepository;
        this.storeRepository = storeRepository;
        this.authService = authService;
    }

    public Mono<DashboardResponse> dashboard(SessionUser actor, LocalDate from, LocalDate to, UUID storeId) {
        DateWindow window;
        try {
            window = DateWindow.of(from, to);
        } catch (ApiException ex) {
            return Mono.error(ex);
        }
        Instant now = Instant.now();

        if (actor.isOwner()) {
            if (storeId == null) {
                return ownerCumulative(actor, window, now);
            }
            return authService.assertOwnsStore(actor.ownerId(), storeId)
                    .then(loadStoreDashboard(window, now, storeId, false, null));
        }
        if (actor.isManager()) {
            return loadStoreDashboard(window, now, actor.storeId(), true, actor.employeeId());
        }
        return Mono.error(ApiException.forbidden("Employees should use the timecard view"));
    }

    public Mono<TimecardResponse> timecard(SessionUser actor, LocalDate from, LocalDate to, UUID employeeId) {
        DateWindow window;
        try {
            window = DateWindow.of(from, to);
        } catch (ApiException ex) {
            return Mono.error(ex);
        }
        UUID targetId = employeeId == null ? actor.employeeId() : employeeId;
        if (targetId == null) {
            return Mono.error(ApiException.badRequest("employeeId is required"));
        }
        Instant now = Instant.now();
        return employeeRepository.findById(targetId)
                .switchIfEmpty(Mono.error(ApiException.notFound("Employee not found")))
                .flatMap(employee -> assertCanViewTimecard(actor, employee)
                        .then(Mono.zip(
                                storeRepository.findById(employee.getStoreId()),
                                attendanceEntryRepository.findByEmployeeIdAndWorkDateBetween(
                                        employee.getId(), window.from(), window.to()).collectList(),
                                attendanceEntryRepository.findByStoreIdAndWorkDateBetween(
                                        employee.getStoreId(), window.from(), window.to()).collectList(),
                                employeeRepository.findByStoreId(employee.getStoreId()).collectList()
                        ).map(tuple -> toTimecard(employee, tuple.getT1(), window, now, tuple.getT2(), tuple.getT3(), tuple.getT4()))));
    }

    private Mono<Void> assertCanViewTimecard(SessionUser actor, Employee employee) {
        if (actor.isOwner()) {
            return authService.assertOwnsStore(actor.ownerId(), employee.getStoreId());
        }
        if (actor.isManager()) {
            boolean self = employee.getId().equals(actor.employeeId());
            boolean report = actor.employeeId().equals(employee.getManagerId());
            if (self || report) {
                return Mono.empty();
            }
            return Mono.error(ApiException.forbidden("Not a reporting employee"));
        }
        if (employee.getId().equals(actor.employeeId())) {
            return Mono.empty();
        }
        return Mono.error(ApiException.forbidden("Cannot view another employee's timecard"));
    }

    private TimecardResponse toTimecard(
            Employee employee,
            Store store,
            DateWindow window,
            Instant now,
            List<AttendanceEntry> ownEntries,
            List<AttendanceEntry> storeEntries,
            List<Employee> storeEmployees
    ) {
        List<TimecardEntry> entries = ownEntries.stream()
                .sorted(Comparator.comparing(AttendanceEntry::getCheckInAt))
                .map(entry -> new TimecardEntry(
                        entry.getId(),
                        entry.getCheckInAt(),
                        entry.getCheckOutAt(),
                        entry.getWorkDate(),
                        entry.isOpen(),
                        roundHours(entry.durationSeconds(now) / 3600.0)
                ))
                .toList();
        double totalHours = roundHours(entries.stream().mapToDouble(TimecardEntry::hours).sum());
        double avgHours = average(totalHours, window.dayCount());
        Map<UUID, Double> hoursByEmployee = storeEntries.stream()
                .collect(Collectors.groupingBy(
                        AttendanceEntry::getEmployeeId,
                        Collectors.summingDouble(e -> e.durationSeconds(now) / 3600.0)
                ));
        double storeTotal = storeEmployees.stream()
                .mapToDouble(emp -> hoursByEmployee.getOrDefault(emp.getId(), 0.0))
                .sum();
        double storeAvgHours = storeEmployees.isEmpty()
                ? 0
                : average(storeTotal / storeEmployees.size(), window.dayCount());
        return new TimecardResponse(
                employee.getId(),
                employee.getFullName(),
                store.getCode(),
                store.getName(),
                window.from(),
                window.to(),
                totalHours,
                avgHours,
                roundHours(storeAvgHours),
                entries
        );
    }

    private Mono<DashboardResponse> ownerCumulative(SessionUser actor, DateWindow window, Instant now) {
        return authService.storesForOwner(actor.ownerId())
                .collectList()
                .flatMap(stores -> {
                    List<UUID> storeIds = stores.stream().map(Store::getId).toList();
                    if (storeIds.isEmpty()) {
                        StoreKpi empty = new StoreKpi(null, "ALL", "All stores", 0, 0, 0, 0);
                        return Mono.just(new DashboardResponse(window.from(), window.to(), true, empty, List.of(), List.of()));
                    }
                    return Mono.zip(
                            employeeRepository.findByStoreIdIn(storeIds).collectList(),
                            attendanceEntryRepository.findByStoreIdInAndWorkDateBetween(storeIds, window.from(), window.to()).collectList(),
                            attendanceEntryRepository.findOpenByStoreIds(storeIds).collectList()
                    ).map(tuple -> build(window, now, stores, tuple.getT1(), tuple.getT2(), tuple.getT3(), true));
                });
    }

    private Mono<DashboardResponse> loadStoreDashboard(
            DateWindow window,
            Instant now,
            UUID storeId,
            boolean managerScope,
            UUID managerId
    ) {
        Mono<List<Employee>> employees = managerScope
                ? employeeRepository.findByStoreIdAndManagerId(storeId, managerId).collectList()
                : employeeRepository.findByStoreId(storeId).collectList();

        return storeRepository.findById(storeId)
                .switchIfEmpty(Mono.error(ApiException.notFound("Store not found")))
                .flatMap(store -> Mono.zip(
                        employees,
                        attendanceEntryRepository.findByStoreIdAndWorkDateBetween(storeId, window.from(), window.to()).collectList(),
                        attendanceEntryRepository.findByStoreIdAndCheckOutAtIsNull(storeId).collectList()
                ).map(tuple -> build(window, now, List.of(store), tuple.getT1(), tuple.getT2(), tuple.getT3(), false)));
    }

    private DashboardResponse build(
            DateWindow window,
            Instant now,
            List<Store> stores,
            List<Employee> employees,
            List<AttendanceEntry> entries,
            List<AttendanceEntry> openEntries,
            boolean cumulative
    ) {
        Map<UUID, Store> storeById = stores.stream().collect(Collectors.toMap(Store::getId, s -> s, (a, b) -> a));
        Map<UUID, List<AttendanceEntry>> byEmployee = entries.stream().collect(Collectors.groupingBy(AttendanceEntry::getEmployeeId));
        Set<UUID> openIds = openEntries.stream().map(AttendanceEntry::getEmployeeId).collect(Collectors.toSet());
        long days = window.dayCount();

        List<EmployeeAttendanceRow> rows = new ArrayList<>();
        for (Employee employee : employees) {
            Store store = storeById.get(employee.getStoreId());
            List<AttendanceEntry> empEntries = byEmployee.getOrDefault(employee.getId(), List.of());
            double hours = roundHours(empEntries.stream().mapToLong(e -> e.durationSeconds(now)).sum() / 3600.0);
            Instant lastIn = empEntries.stream().map(AttendanceEntry::getCheckInAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
            Instant lastOut = empEntries.stream().map(AttendanceEntry::getCheckOutAt).filter(Objects::nonNull).max(Comparator.naturalOrder()).orElse(null);
            rows.add(new EmployeeAttendanceRow(
                    employee.getId(),
                    employee.getFullName(),
                    employee.getUsername(),
                    employee.getRole(),
                    employee.getStatus(),
                    store == null ? "" : store.getCode(),
                    store == null ? "" : store.getName(),
                    employee.getStoreId(),
                    hours,
                    average(hours, days),
                    openIds.contains(employee.getId()),
                    lastIn,
                    lastOut
            ));
        }
        rows.sort(Comparator.comparing(EmployeeAttendanceRow::storeCode).thenComparing(EmployeeAttendanceRow::fullName));

        List<StoreKpi> storeSummaries = new ArrayList<>();
        for (Store store : stores) {
            List<EmployeeAttendanceRow> storeRows = rows.stream().filter(r -> store.getId().equals(r.storeId())).toList();
            storeSummaries.add(kpi(store.getId(), store.getCode(), store.getName(), storeRows, days));
        }

        StoreKpi totals = cumulative || storeSummaries.isEmpty()
                ? kpi(null, "ALL", "All stores", rows, days)
                : kpi(storeSummaries.getFirst().storeId(), storeSummaries.getFirst().storeCode(), storeSummaries.getFirst().storeName(), rows, days);

        return new DashboardResponse(window.from(), window.to(), cumulative, totals, storeSummaries, rows);
    }

    private StoreKpi kpi(UUID storeId, String code, String name, List<EmployeeAttendanceRow> rows, long days) {
        long checkedIn = rows.stream().filter(EmployeeAttendanceRow::currentlyCheckedIn).count();
        double hours = roundHours(rows.stream().mapToDouble(EmployeeAttendanceRow::hoursWorked).sum());
        double perPerson = rows.isEmpty() ? 0 : hours / rows.size();
        return new StoreKpi(storeId, code, name, rows.size(), checkedIn, hours, average(perPerson, days));
    }

    private double average(double totalHours, long days) {
        if (days <= 0) {
            return 0;
        }
        return roundHours(totalHours / days);
    }

    private double roundHours(double hours) {
        return Math.round(hours * 100.0) / 100.0;
    }
}
