package com.store.attendance.web.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        String storeCode,
        @NotBlank String username,
        @NotBlank String password
) {
}
