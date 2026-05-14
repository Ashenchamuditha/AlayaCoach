package com.alaya.controller;

import com.alaya.service.AIService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @Data
    public static class AIMessageRequest {
        private String message;
    }

    @PostMapping("/ai")
    public ResponseEntity<Map<String, String>> askAI(@RequestBody AIMessageRequest req) {
        String reply = aiService.getAIResponse(req.getMessage());
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
