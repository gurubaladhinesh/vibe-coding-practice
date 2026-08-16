package com.store.attendance.security;

import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.web.server.context.ServerSecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class RedisSecurityContextRepository implements ServerSecurityContextRepository {

    private final RedisSessionStore sessionStore;

    public RedisSecurityContextRepository(RedisSessionStore sessionStore) {
        this.sessionStore = sessionStore;
    }

    @Override
    public Mono<Void> save(ServerWebExchange exchange, SecurityContext context) {
        return Mono.empty();
    }

    @Override
    public Mono<SecurityContext> load(ServerWebExchange exchange) {
        String sessionId = SessionCookie.read(exchange);
        if (sessionId == null || sessionId.isBlank()) {
            return Mono.empty();
        }
        return sessionStore.find(sessionId)
                .map(user -> new SecurityContextImpl(new SessionAuthentication(user)));
    }
}
