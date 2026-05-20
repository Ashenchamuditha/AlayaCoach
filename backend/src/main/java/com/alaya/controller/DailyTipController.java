package com.alaya.controller;

import com.alaya.model.DailyTip;
import com.alaya.model.User;
import com.alaya.service.DailyTipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tips")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class DailyTipController {

    private final DailyTipService dailyTipService;

    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Tips controller is active");
    }

    @GetMapping("/daily")
    public ResponseEntity<List<DailyTip>> getDailyTips(@AuthenticationPrincipal User user) {
        if (user == null) {
            log.error("getDailyTips: User is null");
            return ResponseEntity.status(401).build();
        }
        log.info("Fetching daily tips for user ID: {}", user.getId());
        return ResponseEntity.ok(dailyTipService.getDailyTips(user.getId()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<List<DailyTip>> refreshTips(@AuthenticationPrincipal User user) {
        if (user == null) {
            log.error("refreshTips: User is null");
            return ResponseEntity.status(401).build();
        }
        log.info("Refreshing daily tips for user ID: {}", user.getId());
        return ResponseEntity.ok(dailyTipService.generateAndSaveTips(user.getId(), java.time.LocalDate.now()));
    }
}
