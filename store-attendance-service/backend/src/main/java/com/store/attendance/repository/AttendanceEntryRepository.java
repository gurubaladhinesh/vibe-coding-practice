package com.store.attendance.repository;

import com.store.attendance.domain.AttendanceEntry;
import org.springframework.data.r2dbc.repository.Query;
import org.springframework.data.repository.reactive.ReactiveCrudRepository;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.time.LocalDate;
import java.util.Collection;
import java.util.UUID;

public interface AttendanceEntryRepository extends ReactiveCrudRepository<AttendanceEntry, UUID> {

    Mono<AttendanceEntry> findByEmployeeIdAndCheckOutAtIsNull(UUID employeeId);

    Flux<AttendanceEntry> findByEmployeeIdAndWorkDateBetween(UUID employeeId, LocalDate from, LocalDate to);

    Flux<AttendanceEntry> findByStoreIdAndWorkDateBetween(UUID storeId, LocalDate from, LocalDate to);

    @Query("""
            SELECT * FROM attendance_entries
            WHERE store_id IN (:storeIds)
              AND work_date >= :fromDate
              AND work_date <= :toDate
            """)
    Flux<AttendanceEntry> findByStoreIdInAndWorkDateBetween(Collection<UUID> storeIds, LocalDate fromDate, LocalDate toDate);

    Flux<AttendanceEntry> findByStoreIdAndCheckOutAtIsNull(UUID storeId);

    @Query("""
            SELECT * FROM attendance_entries
            WHERE store_id IN (:storeIds)
              AND check_out_at IS NULL
            """)
    Flux<AttendanceEntry> findOpenByStoreIds(Collection<UUID> storeIds);
}
