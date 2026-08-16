package com.store.attendance;

import com.store.attendance.domain.EmployeeRole;
import com.store.attendance.domain.Store;
import com.store.attendance.repository.StoreRepository;
import com.store.attendance.web.dto.DashboardResponse;
import com.store.attendance.web.dto.EmployeeResponse;
import com.store.attendance.web.dto.MeResponse;
import com.store.attendance.web.dto.OnboardEmployeeRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.reactive.server.WebTestClient;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
class AttendanceFlowTest {

    @Autowired
    WebTestClient webTestClient;

    @Autowired
    StoreRepository storeRepository;

    @Test
    void ownerAndStaffFlows() {
        String ownerCookie = login(null, "owner", "password");
        MeResponse owner = me(ownerCookie);
        assertThat(owner.role().name()).isEqualTo("OWNER");
        assertThat(owner.stores()).hasSize(2);

        UUID mainId = owner.stores().stream().filter(s -> s.code().equals("MAIN")).findFirst().orElseThrow().id();
        UUID eastId = owner.stores().stream().filter(s -> s.code().equals("EAST")).findFirst().orElseThrow().id();

        DashboardResponse allStores = dashboard(ownerCookie, null);
        assertThat(allStores.cumulative()).isTrue();
        assertThat(allStores.storeSummaries()).hasSize(2);
        assertThat(allStores.totals().employeeCount()).isGreaterThanOrEqualTo(6);

        DashboardResponse mainDash = dashboard(ownerCookie, mainId);
        assertThat(mainDash.cumulative()).isFalse();
        assertThat(mainDash.employees().size()).isGreaterThanOrEqualTo(3);

        String mgrCookie = login("MAIN", "mgr.main", "password");
        webTestClient.post().uri("/api/attendance/check-out")
                .cookie("SAT_SESSION", mgrCookie)
                .exchange();
        webTestClient.post().uri("/api/attendance/check-in")
                .cookie("SAT_SESSION", mgrCookie)
                .exchange()
                .expectStatus().isOk();

        DashboardResponse afterCheckIn = dashboard(ownerCookie, mainId);
        assertThat(afterCheckIn.totals().currentlyCheckedIn()).isGreaterThanOrEqualTo(1);

        webTestClient.post().uri("/api/attendance/check-in")
                .cookie("SAT_SESSION", mgrCookie)
                .exchange()
                .expectStatus().isEqualTo(409);

        webTestClient.post().uri("/api/attendance/check-out")
                .cookie("SAT_SESSION", mgrCookie)
                .exchange()
                .expectStatus().isOk();

        UUID managerId = mainDash.employees().stream()
                .filter(e -> e.role().name().equals("MANAGER"))
                .findFirst()
                .orElseThrow()
                .employeeId();
        String tempUser = "temp." + UUID.randomUUID().toString().substring(0, 8);

        EmployeeResponse created = webTestClient.post().uri("/api/employees")
                .cookie("SAT_SESSION", ownerCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new OnboardEmployeeRequest(
                        mainId,
                        tempUser,
                        "password",
                        "Temp Worker",
                        EmployeeRole.EMPLOYEE,
                        managerId
                ))
                .exchange()
                .expectStatus().isCreated()
                .expectBody(EmployeeResponse.class)
                .returnResult()
                .getResponseBody();
        assertThat(created).isNotNull();

        webTestClient.post().uri("/api/employees/{id}/terminate", created.id())
                .cookie("SAT_SESSION", ownerCookie)
                .exchange()
                .expectStatus().isOk();

        webTestClient.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(Map.of("storeCode", "MAIN", "username", tempUser, "password", "password"))
                .exchange()
                .expectStatus().isUnauthorized();

        DashboardResponse withTerminated = dashboard(ownerCookie, mainId);
        assertThat(withTerminated.employees().stream().anyMatch(e -> e.status().name().equals("TERMINATED"))).isTrue();

        String empCookie = login("MAIN", "emp1.main", "password");
        webTestClient.post().uri("/api/employees")
                .cookie("SAT_SESSION", empCookie)
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(new OnboardEmployeeRequest(mainId, "x", "password", "X", EmployeeRole.EMPLOYEE, created.id()))
                .exchange()
                .expectStatus().isForbidden();

        Store foreign = storeRepository.findByCodeIgnoreCase("WEST").block();
        if (foreign == null) {
            foreign = storeRepository.save(Store.create("WEST", "West Store")).block();
        }
        assertThat(foreign).isNotNull();
        UUID foreignId = foreign.getId();
        webTestClient.get()
                .uri(uri -> uri.path("/api/attendance/dashboard")
                        .queryParam("from", LocalDate.now().toString())
                        .queryParam("to", LocalDate.now().toString())
                        .queryParam("storeId", foreignId)
                        .build())
                .cookie("SAT_SESSION", ownerCookie)
                .exchange()
                .expectStatus().isForbidden();

        DashboardResponse eastDash = dashboard(ownerCookie, eastId);
        assertThat(eastDash.employees().size()).isGreaterThanOrEqualTo(3);
        assertThat(allStores.storeSummaries()).hasSize(2);
    }

    private String login(String storeCode, String username, String password) {
        var spec = webTestClient.post().uri("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(storeCode == null
                        ? Map.of("username", username, "password", password)
                        : Map.of("storeCode", storeCode, "username", username, "password", password));
        var result = spec.exchange().expectStatus().isOk().expectBody(MeResponse.class).returnResult();
        return result.getResponseCookies().getFirst("SAT_SESSION").getValue();
    }

    private MeResponse me(String cookie) {
        return webTestClient.get().uri("/api/auth/me")
                .cookie("SAT_SESSION", cookie)
                .exchange()
                .expectStatus().isOk()
                .expectBody(MeResponse.class)
                .returnResult()
                .getResponseBody();
    }

    private DashboardResponse dashboard(String cookie, UUID storeId) {
        return webTestClient.get()
                .uri(uri -> {
                    var builder = uri.path("/api/attendance/dashboard")
                            .queryParam("from", LocalDate.now().toString())
                            .queryParam("to", LocalDate.now().toString());
                    if (storeId != null) {
                        builder.queryParam("storeId", storeId);
                    }
                    return builder.build();
                })
                .cookie("SAT_SESSION", cookie)
                .exchange()
                .expectStatus().isOk()
                .expectBody(DashboardResponse.class)
                .returnResult()
                .getResponseBody();
    }
}
