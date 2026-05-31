package com.alaya.service;

import com.alaya.repository.CheckinRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

/**
 * AIService calls the Groq API using Spring WebFlux WebClient (non-blocking).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    private final WebClient.Builder webClientBuilder;
    private final CheckinRepository checkinRepository;

    @Value("${groq.api.url}")
    private String groqApiUrl;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${groq.api.model}")
    private String groqModel;

    @Value("${groq.api.vision-model}")
    private String groqVisionModel;

    @PostConstruct
    public void testConnection() {
        log.info("Checking Groq AI connection...");
        try {
            String testResponse = callGroqAI("Say 'Connection Successful'", "Test");
            if (testResponse != null && !testResponse.isEmpty()) {
                log.info("Groq API connection successful: {}", testResponse);
                System.out.println("ALAYA SYSTEM: Groq API Connection SUCCESSFUL.");
            } else {
                log.warn("Groq API connection test returned empty response.");
                System.out.println("ALAYA SYSTEM: Groq API Connection WARNING - Empty response.");
            }
        } catch (Exception e) {
            log.error("Groq API connection FAILED: {}", e.getMessage());
            System.out.println("ALAYA SYSTEM: Groq API Connection FAILED.");
        }
    }

    public String generateCheckinFeedback(String clientNote) {
        try {
            String res = callGroqAI("You are a professional accountability coach. Respond ONLY in English. " +
                    "Analyze the user's check-in. Be direct. If they are failing, give a tough-love actionable tip. " +
                    "If they are succeeding, give a challenge for tomorrow. " +
                    "Keep your response to a maximum of 2 sentences.", 
                    "My check-in note: " + clientNote);
            return res != null ? res : "Keep up the great work! You're making progress.";
        } catch (Exception e) {
            log.error("Failed to generate AI checkin feedback: {}", e.getMessage());
            return "Check-in logged successfully. Keep going!";
        }
    }

    public String generateFoodFeedback(String foodName, String portion) {
        String portionText = (portion == null || portion.trim().isEmpty()) ? "a normal portion" : portion;
        String prompt = String.format("I ate %s of %s. Estimate the calories. " +
                "Categorize this meal as 'HEALTHY' (good choice) or 'UNHEALTHY' (harmful if frequent). " +
                "Provide 1 sentence of behavioral advice. " +
                "Suggest a specific follow-up question the user can ask in chat. " +
                "Respond ONLY with a JSON object: {\"calories\": 123, \"classification\": \"HEALTHY|UNHEALTHY\", \"feedback\": \"...\", \"chatStarter\": \"...\"}", 
                portionText, foodName);
        
        String res = callGroqAI("You are a professional nutritionist. You MUST respond ONLY with valid JSON. " +
                "The 'feedback' should be professional nutritional advice, max 2 sentences.", 
                prompt);
        return res != null ? res : "{\"calories\": 0, \"classification\": \"HEALTHY\", \"feedback\": \"That's a good choice! Keep monitoring your portions.\", \"chatStarter\": \"How can I improve this meal?\"}";
    }

    public String generateDailyTips(String context) {
        String prompt = "Based on the following user data (food logs, check-ins, and recent AI chats), generate 5 highly personalized, concise, and actionable daily health/fitness tips. " +
                "Each tip should be max 15 words. " +
                "Respond ONLY with a JSON array of strings: [\"tip 1\", \"tip 2\", \"tip 3\", \"tip 4\", \"tip 5\"]. " +
                "Context: " + context;

        String res = callGroqAI("You are an expert personalized health coach. Respond ONLY with valid JSON array of strings.", prompt);
        return res != null ? res : "[\"Stay hydrated throughout the day\", \"Take a 10-minute walk after your next meal\", \"Prioritize 7-8 hours of quality sleep\", \"Focus on mindful eating today\", \"Keep tracking your progress to stay motivated\"]";
    }

    public String analyzeFoodImage(String base64Image, String manualName, String manualPortion) {
        WebClient client = webClientBuilder
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(10 * 1024 * 1024))
                .build();

        String context = "";
        if (manualName != null && !manualName.trim().isEmpty()) {
            context += " The user says this is: " + manualName + ".";
        }
        if (manualPortion != null && !manualPortion.trim().isEmpty()) {
            context += " The user says the portion is: " + manualPortion + ".";
        }

        Map<String, Object> body = Map.of(
            "model", groqVisionModel,
            "messages", List.of(
                Map.of("role", "system", "content", "You are a specialized nutrition AI. You MUST respond ONLY with valid JSON. Do not include markdown formatting or explanations."),
                Map.of("role", "user", "content", List.of(
                    Map.of("type", "text", "text", "Identify the food in this image." + context + 
                            " Estimate calories. Categorize as 'HEALTHY' or 'UNHEALTHY'. " +
                            "Give 1 sentence of advice and 1 suggested chat question. " +
                            "JSON format: {\"foodName\": \"...\", \"calories\": 123, \"classification\": \"HEALTHY|UNHEALTHY\", \"feedback\": \"...\", \"chatStarter\": \"...\"}"),
                    Map.of("type", "image_url", "image_url", Map.of("url", "data:image/jpeg;base64," + base64Image))
                ))
            ),
            "max_tokens", 512,
            "temperature", 0
        );

        try {
            log.info("Analyzing food image with model: {}", groqVisionModel);
            String rawResponse = client.post()
                    .uri(groqApiUrl)
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(status -> status.isError(), response -> 
                        response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("GROQ VISION API ERROR ({}): {}", response.statusCode(), errorBody);
                                    return reactor.core.publisher.Mono.error(new RuntimeException("Groq Vision error"));
                                })
                    )
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(30))
                    .map(response -> {
                        if (response != null && response.containsKey("choices")) {
                            List<?> choices = (List<?>) response.get("choices");
                            if (!choices.isEmpty()) {
                                Map<?, ?> first = (Map<?, ?>) choices.get(0);
                                Map<?, ?> message = (Map<?, ?>) first.get("message");
                                return (String) message.get("content");
                            }
                        }
                        return "";
                    })
                    .block();

            if (rawResponse != null) {
                // Strip markdown code blocks if present
                String cleanJson = rawResponse.trim();
                if (cleanJson.startsWith("```json")) {
                    cleanJson = cleanJson.substring(7, cleanJson.lastIndexOf("```")).trim();
                } else if (cleanJson.startsWith("```")) {
                    cleanJson = cleanJson.substring(3, cleanJson.lastIndexOf("```")).trim();
                }
                return cleanJson;
            }
        } catch (Exception e) {
            log.error("AI Analysis failed: {}", e.getMessage());
        }
        return "{\"foodName\": \"Unknown Food\", \"calories\": 0, \"classification\": \"HEALTHY\", \"feedback\": \"We couldn't identify the food. Try logging manually.\", \"chatStarter\": \"Can you help me identify this food?\"}";
    }

    public String getAIResponse(String userMessage, String userFullName, Long userId) {
        StringBuilder context = new StringBuilder();
        if (userId != null) {
            var checkins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(userId);
            if (!checkins.isEmpty()) {
                context.append("\nRecent User Actions:\n");
                for (var c : checkins) {
                    context.append("- ").append(c.getNote()).append("\n");
                }
            }
        }

        String systemPrompt = String.format(
            "You are the Alaya Master Coach AI Assistant. You are talking to %s. " +
            "Scope: Fitness, diet plans, workout plans, user goal tracking, and motivational coaching. " +
            "Rules: 1. ONLY answer questions within the scope. 2. Politely decline out-of-scope questions. 3. Max 3 sentences. 4. Professional and encouraging. " +
            "%s",
            userFullName != null ? userFullName : "a user",
            context.toString()
        );
        String res = callGroqAI(systemPrompt, userMessage);
        return res != null ? res : "I'm here to help! Keep pushing forward toward your goals.";
    }

    private String callGroqAI(String systemPrompt, String userMessage) {
        WebClient client = webClientBuilder.build();

        Map<String, Object> body = Map.of(
            "model", groqModel,
            "messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userMessage)
            ),
            "max_tokens", 150,
            "temperature", 0.7
        );

        try {
            return client.post()
                    .uri(groqApiUrl)
                    .header("Authorization", "Bearer " + groqApiKey)
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(status -> status.isError(), response -> 
                        response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("Groq AI API Error ({}): {}", response.statusCode(), errorBody);
                                    return reactor.core.publisher.Mono.error(org.springframework.web.reactive.function.client.WebClientResponseException.create(
                                            response.statusCode().value(), 
                                            "Bad Request", 
                                            response.headers().asHttpHeaders(), 
                                            errorBody.getBytes(), 
                                            java.nio.charset.StandardCharsets.UTF_8));
                                })
                    )
                    .bodyToMono(Map.class)
                    .map(response -> {
                        if (response != null && response.containsKey("choices")) {
                            List<?> choices = (List<?>) response.get("choices");
                            if (!choices.isEmpty()) {
                                Map<?, ?> first = (Map<?, ?>) choices.get(0);
                                Map<?, ?> message = (Map<?, ?>) first.get("message");
                                return (String) message.get("content");
                            }
                        }
                        return null;
                    })
                    .block();
        } catch (Exception e) {
            log.error("Groq AI call failed: {}", e.getMessage());
        }
        return null;
    }
}
