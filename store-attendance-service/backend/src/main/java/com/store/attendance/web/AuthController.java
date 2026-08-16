package com.store.attendance.web;

import com.store.attendance.security.CurrentUser;
import com.store.attendance.security.RedisSessionStore;
import com.store.attendance.security.SessionCookie;
import com.store.attendance.service.AuthService;
import com.store.attendance.web.dto.LoginRequest;
import com.store.attendance.web.dto.MeResponse;
import jakarta.validation.Valid;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final RedisSessionStore sessionStore;
    private final Duration sessionTtl;

    public AuthController(AuthService authService, RedisSessionStore sessionStore, Environment env) {
        this.authService = authService;
        this.sessionStore = sessionStore;
        this.sessionTtl = Duration.ofHours(env.getProperty("app.session-ttl-hours", Integer.class, 8));
    }

    @PostMapping("/login")
    public Mono<ResponseEntity<MeResponse>> login(@Valid @RequestBody LoginRequest request, ServerHttpResponse response) {
        return authService.login(request.storeCode(), request.username(), request.password())
                .flatMap(user -> sessionStore.create(user)
                        .flatMap(sessionId -> {
                            SessionCookie.write(response, sessionId, sessionTtl);
                            return authService.me(user);
                        }))
                .map(ResponseEntity::ok);
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<Void>> logout(ServerWebExchange exchange) {
        String sessionId = SessionCookie.read(exchange);
        SessionCookie.clear(exchange.getResponse());
        Mono<Void> delete = sessionId == null ? Mono.empty() : sessionStore.delete(sessionId);
        return delete.thenReturn(ResponseEntity.noContent().build());
    }

    @GetMapping("/me")
    public Mono<MeResponse> me() {
        return CurrentUser.require().flatMap(authService::me);
    }
}
