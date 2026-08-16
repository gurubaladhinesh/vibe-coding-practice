package com.store.attendance.service;

import com.store.attendance.web.error.ApiException;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public record DateWindow(LocalDate from, LocalDate to) {

    public static DateWindow of(LocalDate from, LocalDate to) {
        LocalDate start = from == null ? LocalDate.now() : from;
        LocalDate end = to == null ? start : to;
        if (end.isBefore(start)) {
            throw ApiException.badRequest("End date must be on or after start date");
        }
        return new DateWindow(start, end);
    }

    public long dayCount() {
        return ChronoUnit.DAYS.between(from, to) + 1;
    }
}
