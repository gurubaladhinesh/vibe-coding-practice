package com.store.attendance.config;

import com.store.attendance.domain.AttendanceEntry;
import com.store.attendance.domain.Employee;
import com.store.attendance.domain.Owner;
import com.store.attendance.domain.OwnerStore;
import com.store.attendance.domain.Store;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.r2dbc.mapping.event.AfterConvertCallback;
import reactor.core.publisher.Mono;

@Configuration
public class R2dbcConfig {

    @Bean
    AfterConvertCallback<Owner> ownerAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }

    @Bean
    AfterConvertCallback<Store> storeAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }

    @Bean
    AfterConvertCallback<OwnerStore> ownerStoreAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }

    @Bean
    AfterConvertCallback<Employee> employeeAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }

    @Bean
    AfterConvertCallback<AttendanceEntry> attendanceAfterConvert() {
        return (entity, table) -> {
            entity.markPersisted();
            return Mono.just(entity);
        };
    }
}
