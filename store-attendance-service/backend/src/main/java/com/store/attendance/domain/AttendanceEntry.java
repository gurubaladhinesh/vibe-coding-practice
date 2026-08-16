package com.store.attendance.domain;

import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.domain.Persistable;
import org.springframework.data.relational.core.mapping.Table;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Table("attendance_entries")
public class AttendanceEntry implements Persistable<UUID> {

    @Id
    private UUID id;
    private UUID employeeId;
    private UUID storeId;
    private Instant checkInAt;
    private Instant checkOutAt;
    private LocalDate workDate;

    @Transient
    private boolean newEntity = true;

    public AttendanceEntry() {
    }

    public static AttendanceEntry checkIn(UUID employeeId, UUID storeId, Instant at, LocalDate workDate) {
        AttendanceEntry entry = new AttendanceEntry();
        entry.id = UUID.randomUUID();
        entry.employeeId = employeeId;
        entry.storeId = storeId;
        entry.checkInAt = at;
        entry.workDate = workDate;
        entry.newEntity = true;
        return entry;
    }

    public void checkOut(Instant at) {
        this.checkOutAt = at;
        this.newEntity = false;
    }

    public boolean isOpen() {
        return checkOutAt == null;
    }

    public long durationSeconds(Instant now) {
        Instant end = checkOutAt != null ? checkOutAt : now;
        long seconds = end.getEpochSecond() - checkInAt.getEpochSecond();
        return Math.max(0, seconds);
    }

    @Override
    public UUID getId() {
        return id;
    }

    @Override
    public boolean isNew() {
        return newEntity;
    }

    public void markPersisted() {
        this.newEntity = false;
    }

    public UUID getEmployeeId() {
        return employeeId;
    }

    public UUID getStoreId() {
        return storeId;
    }

    public Instant getCheckInAt() {
        return checkInAt;
    }

    public Instant getCheckOutAt() {
        return checkOutAt;
    }

    public LocalDate getWorkDate() {
        return workDate;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setEmployeeId(UUID employeeId) {
        this.employeeId = employeeId;
    }

    public void setStoreId(UUID storeId) {
        this.storeId = storeId;
    }

    public void setCheckInAt(Instant checkInAt) {
        this.checkInAt = checkInAt;
    }

    public void setCheckOutAt(Instant checkOutAt) {
        this.checkOutAt = checkOutAt;
    }

    public void setWorkDate(LocalDate workDate) {
        this.workDate = workDate;
    }
}
