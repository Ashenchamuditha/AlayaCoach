package com.alaya.controller;

import com.alaya.model.User;
import com.alaya.service.AIService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;
    private final com.alaya.service.AIChatService aiChatService;

    @Data
    public static class AIMessageRequest {
        private String message;
    }

    @PostMapping("/ai")
    public ResponseEntity<Map<String, String>> askAI(@RequestBody AIMessageRequest req,
                                                   @AuthenticationPrincipal User user) {
        // Save user message
        aiChatService.saveMessage(user.getId(), "user", req.getMessage());
        
        String reply = aiService.getAIResponse(req.getMessage(), user.getFullName(), user.getId());
        
        // Save assistant reply
        aiChatService.saveMessage(user.getId(), "assistant", reply);
        
        return ResponseEntity.ok(Map.of("reply", reply));
    }
}
