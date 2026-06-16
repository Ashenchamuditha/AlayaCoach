package com.alaya.service;

import com.alaya.model.AIChat;
import com.alaya.model.Goal;
import com.alaya.model.User;
import com.alaya.repository.CheckinRepository;
import com.alaya.repository.FoodEntryRepository;
import com.alaya.repository.GoalRepository;
import com.alaya.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * AIService calls the Groq API using Spring WebFlux WebClient (non-blocking).
 * Updated May 2026 to support Llama 4 Multimodal series.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class AIService {

    private final WebClient.Builder webClientBuilder;
    private final CheckinRepository checkinRepository;
    private final UserRepository userRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final GoalRepository goalRepository;

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

        // Safety check: Log masked API key to help user verify in Railway logs
        if (groqApiKey != null && groqApiKey.length() > 10) {
            log.info("Vision AI using Key: {}...{}", groqApiKey.substring(0, 6), groqApiKey.substring(groqApiKey.length() - 4));
        }

        String context = "";
        if (manualName != null && !manualName.trim().isEmpty()) {
            context += " The user says this is: " + manualName + ".";
        }
        if (manualPortion != null && !manualPortion.trim().isEmpty()) {
            context += " The user says the portion is: " + manualPortion + ".";
        }

        // Use Llama 4 Scout as the primary vision model (May 2026 stable)
        String modelToUse = (groqVisionModel != null && !groqVisionModel.contains("NO_MODEL")) 
            ? groqVisionModel : "meta-llama/llama-4-scout-17b-16e-instruct";

        Map<String, Object> body = Map.of(
            "model", modelToUse,
            "messages", List.of(
                Map.of("role", "user", "content", List.of(
                    Map.of("type", "text", "text", "You are a specialized nutrition AI. Identify the food in this image." + context + 
                            " Estimate calories. Categorize as 'HEALTHY' or 'UNHEALTHY'. " +
                            "Respond ONLY with a JSON object: {\"foodName\": \"...\", \"calories\": 123, \"classification\": \"HEALTHY|UNHEALTHY\", \"feedback\": \"...\", \"chatStarter\": \"...\"}"),
                    Map.of("type", "image_url", "image_url", Map.of("url", "data:image/jpeg;base64," + base64Image))
                ))
            ),
            "max_tokens", 1024,
            "temperature", 0
        );

        try {
            log.info("Analyzing food image with model: {}", modelToUse);
            String rawResponse = client.post()
                    .uri(groqApiUrl)
                    .header("Authorization", "Bearer " + groqApiKey.trim())
                    .header("Content-Type", "application/json")
                    .bodyValue(body)
                    .retrieve()
                    .onStatus(status -> status.isError(), response -> 
                        response.bodyToMono(String.class)
                                .flatMap(errorBody -> {
                                    log.error("GROQ VISION API ERROR ({}): {}", response.statusCode(), errorBody);
                                    return reactor.core.publisher.Mono.error(new RuntimeException("Groq Vision error: " + errorBody));
                                })
                    )
                    .bodyToMono(Map.class)
                    .timeout(java.time.Duration.ofSeconds(60))
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

            if (rawResponse != null && !rawResponse.isBlank()) {
                // Smart JSON Extraction: Find the first { and last }
                int start = rawResponse.indexOf("{");
                int end = rawResponse.lastIndexOf("}");
                if (start != -1 && end != -1 && end > start) {
                    return rawResponse.substring(start, end + 1).trim();
                }
                return rawResponse.trim();
            }
        } catch (Exception e) {
            log.error("AI Analysis failed: {}", e.getMessage());
        }
        return "{\"foodName\": \"Unknown Food\", \"calories\": 0, \"classification\": \"HEALTHY\", \"feedback\": \"We couldn't identify the food. Try logging manually.\", \"chatStarter\": \"Can you help me identify this food?\"}";
    }

    public String getAIResponse(String userMessage, String userFullName, Long userId, List<com.alaya.model.AIChat> history) {
        StringBuilder context = new StringBuilder();
        if (userId != null) {
            // 1. Fetch User Biometrics
            userRepository.findById(userId).ifPresent(u -> {
                context.append("\nUser Profile:\n");
                if (u.getGender() != null) context.append("- Gender: ").append(u.getGender()).append("\n");
                if (u.getBirthDate() != null) context.append("- Birth Date: ").append(u.getBirthDate()).append("\n");
                if (u.getCurrentWeight() != null) context.append("- Weight: ").append(u.getCurrentWeight()).append("kg\n");
                if (u.getTargetWeight() != null) context.append("- Target Weight: ").append(u.getTargetWeight()).append("kg\n");
                if (u.getHeightCm() != null) context.append("- Height: ").append(u.getHeightCm()).append("cm\n");
                if (u.getActivityLevel() != null) context.append("- Activity Level: ").append(u.getActivityLevel()).append("\n");
                if (u.getPrimaryGoal() != null) context.append("- Primary Goal: ").append(u.getPrimaryGoal()).append("\n");
            });

            // 2. Fetch Recent Check-ins
            var checkins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(userId);
            if (!checkins.isEmpty()) {
                context.append("\nRecent Check-ins:\n");
                for (var c : checkins) {
                    context.append("- ").append(c.getNote()).append("\n");
                }
            }

            // 3. Fetch Active Goals
            var goals = goalRepository.findAllByClientIdAndDeletedByClientFalseOrderByCreatedAtDesc(userId);
            if (!goals.isEmpty()) {
                context.append("\nActive Goals:\n");
                goals.stream().filter(g -> g.getStatus() == com.alaya.model.Goal.GoalStatus.ACTIVE)
                     .limit(5)
                     .forEach(g -> context.append("- ").append(g.getTitle()).append(" (").append(g.getCategory()).append(")\n"));
            }

            // 4. Fetch Recent Food Logs
            var foodLogs = foodEntryRepository.findAllByClientIdOrderByEntryTimeDesc(userId);
            if (!foodLogs.isEmpty()) {
                context.append("\nRecent Food Logs:\n");
                foodLogs.stream().limit(5).forEach(f -> 
                    context.append("- ").append(f.getFoodName()).append(" (").append(f.getCalories()).append(" kcal) at ")
                           .append(f.getEntryTime().toLocalTime()).append("\n")
                );
            }
        }

        String systemPrompt = String.format(
            "You are the Alaya Master Coach AI Assistant. You are talking to %s. " +
            "Scope: Fitness, diet plans, workout plans, user goal tracking, and motivational coaching. " +
            "Context: You have access to the user's profile, goals, and recent activity. Use this data to provide hyper-personalized advice. " +
            "If the user asks for advice, calculate suggestions based on their weight, height, and goals. " +
            "Adaptive Response Length: Match the depth and length of your response to the user's inquiry. " +
            "Rules: " +
            "1. ONLY answer questions within the scope. " +
            "2. Use the provided user context to be specific. Don't give generic advice if you can use their data. " +
            "3. Provide educational value and explain the 'why'. " +
            "4. Mirror the user's tone. " +
            "%s",
            userFullName != null ? userFullName : "a user",
            context.toString()
        );

        List<Map<String, String>> messages = new java.util.ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (history != null) {
            int start = Math.max(0, history.size() - 10);
            for (int i = start; i < history.size(); i++) {
                var h = history.get(i);
                messages.add(Map.of("role", h.getRole(), "content", h.getContent()));
            }
        }

        messages.add(Map.of("role", "user", "content", userMessage));

        String res = callGroqAI(messages);
        return res != null ? res : "I'm here to help! Keep pushing forward toward your goals.";
    }

    public String generateWeeklyReportSummary(String userData) {
        String systemPrompt = "You are a professional accountability coach and data analyst. " +
                "Analyze the provided weekly data for a client (goals, food logs, check-ins). " +
                "Generate two summaries:\n" +
                "1. 'clientSummary': A detailed, encouraging report describing the user's activities over the week. Include specific observations about their habits, followed by actionable ideas and concrete suggestions for the upcoming week to improve their progress. Max 8-10 sentences.\n" +
                "2. 'coachBrief': A high-level brief for the coach. Highlight if the client is struggling, why, and where the coach should focus. Max 3 sentences.\n" +
                "Respond ONLY with a JSON object: {\"clientSummary\": \"...\", \"coachBrief\": \"...\"}";

        String res = callGroqAI(systemPrompt, "Weekly Data Context: " + userData);
        return res != null ? res : "{\"clientSummary\": \"Great work this week! Keep tracking your progress to get more insights.\", \"coachBrief\": \"Client is making steady progress.\"}";
    }

    private String callGroqAI(List<Map<String, String>> messages) {
        WebClient client = webClientBuilder.build();

        Map<String, Object> body = Map.of(
            "model", groqModel,
            "messages", messages,
            "max_tokens", 512,
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

    private String callGroqAI(String systemPrompt, String userMessage) {
        return callGroqAI(List.of(
            Map.of("role", "system", "content", systemPrompt),
            Map.of("role", "user", "content", userMessage)
        ));
    }
}
