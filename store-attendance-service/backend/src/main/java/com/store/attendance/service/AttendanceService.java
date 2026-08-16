package com.store.attendance.service;

import com.store.attendance.domain.AttendanceEntry;
import com.store.attendance.repository.AttendanceEntryRepository;
import com.store.attendance.security.SessionUser;
import com.store.attendance.web.dto.AttendanceResponse;
import com.store.attendance.web.error.ApiException;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

@Service
public class AttendanceService {

    private final AttendanceEntryRepository attendanceEntryRepository;

    public AttendanceService(AttendanceEntryRepository attendanceEntryRepository) {
        this.attendanceEntryRepository = attendanceEntryRepository;
    }

    public Mono<AttendanceResponse> checkIn(SessionUser actor) {
        if (!actor.isStaff()) {
            return Mono.error(ApiException.forbidden("Owners do not check in"));
        }
        Instant now = Instant.now();
        return attendanceEntryRepository.findByEmployeeIdAndCheckOutAtIsNull(actor.employeeId())
                .flatMap(open -> Mono.<AttendanceEntry>error(ApiException.conflict("Already checked in")))
                .switchIfEmpty(Mono.defer(() -> attendanceEntryRepository.save(
                        AttendanceEntry.checkIn(
                                actor.employeeId(),
                                actor.storeId(),
                                now,
                                LocalDate.ofInstant(now, ZoneId.systemDefault())
                        )
                )))
                .map(this::toResponse);
    }

    public Mono<AttendanceResponse> checkOut(SessionUser actor) {
        if (!actor.isStaff()) {
            return Mono.error(ApiException.forbidden("Owners do not check out"));
        }
        return attendanceEntryRepository.findByEmployeeIdAndCheckOutAtIsNull(actor.employeeId())
                .switchIfEmpty(Mono.error(ApiException.conflict("Not currently checked in")))
                .flatMap(entry -> {
                    entry.checkOut(Instant.now());
                    return attendanceEntryRepository.save(entry);
                })
                .map(this::toResponse);
    }

    public AttendanceResponse toResponse(AttendanceEntry entry) {
        return new AttendanceResponse(
                entry.getId(),
                entry.getEmployeeId(),
                entry.getStoreId(),
                entry.getCheckInAt(),
                entry.getCheckOutAt(),
                entry.getWorkDate(),
                entry.isOpen()
        );
    }
}
