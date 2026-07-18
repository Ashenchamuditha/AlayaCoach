package com.alaya.controller;

import com.alaya.model.AIChat;
import com.alaya.model.User;
import com.alaya.service.AIChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/ai/history")
@RequiredArgsConstructor
public class AIChatController {

    private final AIChatService aiChatService;

    @GetMapping
    public ResponseEntity<List<AIChat>> getHistory(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(aiChatService.getUserHistory(user.getId()));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<List<AIChat>> getClientHistory(@PathVariable Long clientId) {
        return ResponseEntity.ok(aiChatService.getUserHistory(clientId));
    }

    @DeleteMapping
    public ResponseEntity<Void> clearHistory(@AuthenticationPrincipal User user) {
        aiChatService.clearHistory(user.getId());
        return ResponseEntity.noContent().build();
    }
}
