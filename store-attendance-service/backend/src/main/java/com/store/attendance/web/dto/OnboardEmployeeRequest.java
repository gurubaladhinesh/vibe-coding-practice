package com.store.attendance.web.dto;

import com.store.attendance.domain.EmployeeRole;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record OnboardEmployeeRequest(
        UUID storeId,
        @NotBlank String username,
        @NotBlank String password,
        @NotBlank String fullName,
        @NotNull EmployeeRole role,
        UUID managerId
) {
}
