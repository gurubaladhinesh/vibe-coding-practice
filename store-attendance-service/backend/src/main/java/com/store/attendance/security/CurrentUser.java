package com.store.attendance.security;

import org.springframework.security.core.context.ReactiveSecurityContextHolder;
import reactor.core.publisher.Mono;

public final class CurrentUser {

    private CurrentUser() {
    }

    public static Mono<SessionUser> require() {
        return ReactiveSecurityContextHolder.getContext()
                .map(ctx -> (SessionUser) ctx.getAuthentication().getPrincipal())
                .switchIfEmpty(Mono.error(new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED, "Not authenticated")));
    }
}
