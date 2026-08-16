package com.store.attendance.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;

@Component
public class RedisSessionStore {

    private static final String KEY_PREFIX = "session:";

    private final ReactiveStringRedisTemplate redis;
    private final ObjectMapper objectMapper;
    private final Duration ttl;

    public RedisSessionStore(
            ReactiveStringRedisTemplate redis,
            ObjectMapper objectMapper,
            org.springframework.core.env.Environment env
    ) {
        this.redis = redis;
        this.objectMapper = objectMapper;
        int hours = env.getProperty("app.session-ttl-hours", Integer.class, 8);
        this.ttl = Duration.ofHours(hours);
    }

    public Mono<String> create(SessionUser user) {
        String sessionId = UUID.randomUUID().toString();
        return write(sessionId, user).thenReturn(sessionId);
    }

    public Mono<SessionUser> find(String sessionId) {
        return redis.opsForValue()
                .get(KEY_PREFIX + sessionId)
                .flatMap(json -> Mono.fromCallable(() -> objectMapper.readValue(json, SessionUser.class)));
    }

    public Mono<Void> delete(String sessionId) {
        return redis.delete(KEY_PREFIX + sessionId).then();
    }

    private Mono<Boolean> write(String sessionId, SessionUser user) {
        return Mono.fromCallable(() -> objectMapper.writeValueAsString(user))
                .flatMap(json -> redis.opsForValue().set(KEY_PREFIX + sessionId, json, ttl));
    }
}
