package com.alaya.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * AIService calls the Groq API using Spring WebFlux WebClient (non-blocking).
 * Prompt is always in English and capped at 2 sentences in the instruction.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    private final WebClient.Builder webClientBuilder;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.model}")
    private String groqModel;

    public String generateCheckinFeedback(String clientNote) {
        return callGroqAI("You are an accountability coach. Respond ONLY in English. " +
                "Keep your response to a maximum of 2 sentences. " +
                "Be encouraging, concise, and actionable.", "My check-in note: " + clientNote);
    }

    public String getAIResponse(String userMessage) {
        return callGroqAI("You are an accountability coach assistant. Provide helpful, motivating, and strategic advice. " +
                "Respond in English and keep it under 3 sentences.", userMessage);
    }

    private String callGroqAI(String systemPrompt, String userMessage) {
        WebClient client = webClientBuilder
                .baseUrl(groqApiUrl)
                .defaultHeader("Authorization", "Bearer " + groqApiKey)
                .defaultHeader("Content-Type", "application/json")
                .build();

        Map<String, Object> body = Map.of(
            "model", groqModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
            ),
            "max_tokens", 150
        );

        try {
            Map<?, ?> response = client.post()
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            if (response != null && response.containsKey("choices")) {
                List<?> choices = (List<?>) response.get("choices");
                if (!choices.isEmpty()) {
                    Map<?, ?> first = (Map<?, ?>) choices.get(0);
                    Map<?, ?> message = (Map<?, ?>) first.get("message");
                    return (String) message.get("content");
                }
            }
        } catch (Exception e) {
            log.error("Groq AI call failed: {}", e.getMessage());
        }
        return "I'm here to help! Keep pushing forward toward your goals.";
    }
}
