package com.store.attendance.web;

import com.store.attendance.security.CurrentUser;
import com.store.attendance.service.AuthService;
import com.store.attendance.web.dto.StoreSummary;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/stores")
public class StoreController {

    private final AuthService authService;

    public StoreController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping
    public Flux<StoreSummary> list() {
        return CurrentUser.require()
                .flatMapMany(user -> user.isOwner()
                        ? authService.ownerStores(user.ownerId()).flatMapMany(Flux::fromIterable)
                        : authService.me(user).flatMapMany(me -> Flux.fromIterable(me.stores())));
    }
}
