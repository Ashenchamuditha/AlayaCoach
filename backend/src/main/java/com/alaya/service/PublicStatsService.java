package com.alaya.service;

import com.alaya.model.Goal;
import com.alaya.model.Role;
import com.alaya.repository.GoalRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PublicStatsService {

    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final com.alaya.repository.ChatMessageRepository chatMessageRepository;

    public Map<String, Object> getPublicStats() {
        long activeUsers      = userRepository.countByRole(Role.CLIENT);
        long goalsCompleted  = goalRepository.countByStatus(Goal.GoalStatus.COMPLETED);
        long coaches         = userRepository.countByRole(Role.COACH);
        long messagesExchanged = chatMessageRepository.count();

        return Map.of(
            "activeUsers",     activeUsers,
            "goalsCompleted",  goalsCompleted,
            "coaches",         coaches,
            "messagesExchanged", messagesExchanged
        );
    }

    public List<Map<String, String>> getFeatures() {
        return List.of(
            Map.of("icon", "target",   "title", "Goal Setting",
                   "description", "Coaches create structured goals tailored to each client"),
            Map.of("icon", "check",    "title", "Daily Check-Ins",
                   "description", "Clients log progress with AI-powered instant feedback"),
            Map.of("icon", "brain",    "title", "AI Coaching",
                   "description", "Powered by Groq LLM for real-time encouragement"),
            Map.of("icon", "message",  "title", "Real-Time Chat",
                   "description", "Secure WebSocket messaging between coach and client"),
            Map.of("icon", "bar-chart","title", "Progress Dashboard",
                   "description", "Visual insights for both coaches and clients")
        );
    }
}
