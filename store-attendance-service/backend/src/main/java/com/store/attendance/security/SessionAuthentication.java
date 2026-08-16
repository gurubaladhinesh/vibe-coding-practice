package com.store.attendance.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public class SessionAuthentication extends AbstractAuthenticationToken {

    private final SessionUser user;

    public SessionAuthentication(SessionUser user) {
        super(List.of(new SimpleGrantedAuthority("ROLE_" + user.type().name())));
        this.user = user;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    @Override
    public SessionUser getPrincipal() {
        return user;
    }

    @Override
    public String getName() {
        return user.username();
    }
}
