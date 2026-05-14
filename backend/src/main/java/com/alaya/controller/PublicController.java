package com.alaya.controller;

import com.alaya.service.PublicStatsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * Public endpoints — no authentication required.
 * Used by the marketing / landing page.
 */
@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PublicStatsService publicStatsService;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        return ResponseEntity.ok(publicStatsService.getPublicStats());
    }

    @GetMapping("/features")
    public ResponseEntity<List<Map<String, String>>> getFeatures() {
        return ResponseEntity.ok(publicStatsService.getFeatures());
    }
}
