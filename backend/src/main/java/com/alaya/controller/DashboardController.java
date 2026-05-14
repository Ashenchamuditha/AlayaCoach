package com.alaya.controller;

import com.alaya.model.User;
import com.alaya.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/coach")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Map<String, Object>> coachDashboard(@AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(dashboardService.getCoachDashboard(coach.getId()));
    }

    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Map<String, Object>> clientDashboard(@AuthenticationPrincipal User client) {
        return ResponseEntity.ok(dashboardService.getClientDashboard(client.getId()));
    }

    @GetMapping("/coach/clients")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<java.util.List<Map<String, Object>>> coachClients(@AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(dashboardService.getCoachClients(coach.getId()));
    }
}
