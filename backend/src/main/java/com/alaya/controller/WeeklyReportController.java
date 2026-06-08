package com.alaya.controller;

import com.alaya.model.User;
import com.alaya.model.WeeklyReport;
import com.alaya.service.WeeklyReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class WeeklyReportController {

    private final WeeklyReportService weeklyReportService;

    @GetMapping("/latest")
    public ResponseEntity<WeeklyReport> getLatestReport(@AuthenticationPrincipal User user) {
        return weeklyReportService.getLatestReport(user.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/latest/client/{clientId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<WeeklyReport> getLatestReportForClient(@PathVariable Long clientId) {
        return weeklyReportService.getLatestReport(clientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/generate")
    public ResponseEntity<WeeklyReport> generateReport(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(weeklyReportService.generateWeeklyReport(user.getId()));
    }

    @PostMapping("/generate/client/{clientId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<WeeklyReport> generateReportForClient(@PathVariable Long clientId) {
        return ResponseEntity.ok(weeklyReportService.generateWeeklyReport(clientId));
    }
}
