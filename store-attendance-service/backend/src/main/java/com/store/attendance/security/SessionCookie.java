package com.store.attendance.security;

import org.springframework.http.HttpCookie;
import org.springframework.http.ResponseCookie;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.server.ServerWebExchange;

import java.time.Duration;

public final class SessionCookie {

    public static final String NAME = "SAT_SESSION";

    private SessionCookie() {
    }

    public static String read(ServerWebExchange exchange) {
        HttpCookie cookie = exchange.getRequest().getCookies().getFirst(NAME);
        return cookie == null ? null : cookie.getValue();
    }

    public static void write(ServerHttpResponse response, String sessionId, Duration ttl) {
        response.addCookie(ResponseCookie.from(NAME, sessionId)
                .httpOnly(true)
                .path("/")
                .maxAge(ttl)
                .sameSite("Lax")
                .build());
    }

    public static void clear(ServerHttpResponse response) {
        response.addCookie(ResponseCookie.from(NAME, "")
                .httpOnly(true)
                .path("/")
                .maxAge(Duration.ZERO)
                .sameSite("Lax")
                .build());
    }
}
