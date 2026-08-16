package com.store.attendance.web.error;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.support.WebExchangeBindException;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public Mono<ResponseEntity<Map<String, String>>> handleApi(ApiException ex) {
        return Mono.just(ResponseEntity.status(ex.getStatus())
                .body(Map.of("message", ex.getMessage())));
    }

    @ExceptionHandler(WebExchangeBindException.class)
    public Mono<ResponseEntity<Map<String, String>>> handleValidation(WebExchangeBindException ex) {
        String message = ex.getFieldErrors().stream()
                .findFirst()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .orElse("Validation failed");
        return Mono.just(ResponseEntity.badRequest().body(Map.of("message", message)));
    }
}
