package com.alaya.controller;

import com.alaya.model.User;
import com.alaya.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/coach")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Map<String, Object>> coachDashboard(@AuthenticationPrincipal User coach) {
        if (coach == null || coach.getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(dashboardService.getCoachDashboard(coach.getId()));
    }

    @GetMapping("/client")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Map<String, Object>> clientDashboard(@AuthenticationPrincipal User client) {
        if (client == null || client.getId() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(dashboardService.getClientDashboard(client.getId()));
    }

    @GetMapping("/coach/clients")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<List<Map<String, Object>>> coachClients(@AuthenticationPrincipal User coach) {
        if (coach == null || coach.getId() == null) {
            System.err.println("ERROR: Unauthorized or missing coach ID");
            return ResponseEntity.status(401).build();
        }
        System.out.println("DEBUG: Coach Accessing Dashboard: " + coach.getEmail());
        return ResponseEntity.ok(dashboardService.getCoachClients(coach.getId()));
    }

    @PutMapping("/coach/clients/{clientId}/archive")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Void> archiveClient(
            @PathVariable Long clientId,
            @RequestParam boolean archived) {
        dashboardService.archiveClient(clientId, archived);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/coach/clients/{clientId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Void> deleteClient(@PathVariable Long clientId) {
        dashboardService.deleteClient(clientId);
        return ResponseEntity.ok().build();
    }
}
