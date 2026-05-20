package com.alaya.controller;

import com.alaya.model.DailyTip;
import com.alaya.model.User;
import com.alaya.service.DailyTipService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tips")
@RequiredArgsConstructor
public class DailyTipController {

    private final DailyTipService dailyTipService;

    @GetMapping("/daily")
    public ResponseEntity<List<DailyTip>> getDailyTips(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dailyTipService.getDailyTips(user.getId()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<List<DailyTip>> refreshTips(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(dailyTipService.generateAndSaveTips(user.getId(), java.time.LocalDate.now()));
    }
}
