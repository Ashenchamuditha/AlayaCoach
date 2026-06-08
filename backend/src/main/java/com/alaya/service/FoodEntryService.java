package com.alaya.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.alaya.model.FoodEntry;
import com.alaya.model.Role;
import com.alaya.repository.FoodEntryRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class FoodEntryService {

    private final FoodEntryRepository foodEntryRepository;
    private final UserRepository userRepository;
    private final AIService aiService;
    private final FileStorageService fileStorageService;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public FoodEntry logFoodEntry(Long clientId, String foodName, String portion, LocalDateTime entryTime) {
        String aiJson = aiService.generateFoodFeedback(foodName, portion);
        
        Integer estimatedCalories = 0;
        String advice = "That's a good choice! Keep monitoring your portions.";
        String classification = "HEALTHY";
        String chatStarter = "How can I balance this meal better?";

        try {
            JsonNode node = objectMapper.readTree(aiJson);
            estimatedCalories = node.get("calories").asInt();
            advice = node.get("feedback").asText();
            classification = node.get("classification").asText();
            chatStarter = node.get("chatStarter").asText();
        } catch (Exception e) {
            log.error("Failed to parse AI food feedback: {}", e.getMessage());
        }

        FoodEntry entry = FoodEntry.builder()
                .clientId(clientId)
                .foodName(foodName)
                .portion(portion)
                .calories(estimatedCalories)
                .entryTime(entryTime != null ? entryTime : LocalDateTime.now())
                .aiFeedback(advice)
                .classification(classification)
                .chatStarter(chatStarter)
                .build();
        
        return foodEntryRepository.save(entry);
    }

    public FoodEntry logFoodWithImage(Long clientId, MultipartFile file, String manualName, String manualPortion, LocalDateTime entryTime) {
        String fileName = fileStorageService.storeFile(file);
        String imageUrl = "/uploads/food/" + fileName;

        String base64Image;
        try {
            base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Could not read file for AI analysis", e);
        }

        // Pass manual context to AI if available
        String aiJson = aiService.analyzeFoodImage(base64Image, manualName, manualPortion);
        
        String foodName = (manualName != null && !manualName.trim().isEmpty()) ? manualName : "Uploaded Food";
        String portion = (manualPortion != null && !manualPortion.trim().isEmpty()) ? manualPortion : null;
        Integer calories = 0;
        String advice = "Analysis failed. Please log manually.";
        String classification = "HEALTHY";
        String chatStarter = "Can you tell me more about the nutrients in this?";

        try {
            JsonNode node = objectMapper.readTree(aiJson);
            
            // AI detected name only if user didn't provide one
            if (manualName == null || manualName.trim().isEmpty()) {
                foodName = node.get("foodName").asText();
            }
            
            calories = node.get("calories").asInt();
            advice = node.get("feedback").asText();
            classification = node.get("classification").asText();
            chatStarter = node.get("chatStarter").asText();
        } catch (Exception e) {
            log.error("Failed to parse AI vision feedback: {}", e.getMessage());
        }

        FoodEntry entry = FoodEntry.builder()
                .clientId(clientId)
                .foodName(foodName)
                .portion(portion)
                .calories(calories)
                .entryTime(entryTime != null ? entryTime : LocalDateTime.now())
                .aiFeedback(advice)
                .classification(classification)
                .chatStarter(chatStarter)
                .imageUrl(imageUrl)
                .build();
        
        return foodEntryRepository.save(entry);
    }

    public List<FoodEntry> getClientFoodEntries(Long clientId) {
        return foodEntryRepository.findAllByClientIdOrderByEntryTimeDesc(clientId);
    }

    public void deleteFoodEntry(Long entryId, Long userId, Role role) {
        FoodEntry entry = foodEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Food entry not found"));

        if (role == Role.CLIENT) {
            if (!entry.getClientId().equals(userId)) {
                throw new AccessDeniedException("Not authorized to delete this food entry");
            }
        }
        
        foodEntryRepository.delete(entry);
    }

    public FoodEntry addCoachFeedback(Long entryId, String feedback) {
        FoodEntry entry = foodEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Food entry not found"));
        entry.setCoachFeedback(feedback);
        entry.setUpdatedAt(LocalDateTime.now());
        FoodEntry saved = foodEntryRepository.save(entry);

        // Send real-time notification to client
        userRepository.findById(saved.getClientId()).ifPresent(client -> {
            messagingTemplate.convertAndSendToUser(
                    client.getEmail(),
                    "/queue/updates",
                    Map.of("type", "FOOD_FEEDBACK", "foodEntryId", entryId)
            );

            // Create system notification for food feedback
            notificationService.createNotification(
                    saved.getClientId(),
                    "New Coach Feedback on Food Log",
                    "Your coach left feedback on your meal: " + saved.getFoodName(),
                    com.alaya.model.Notification.NotificationType.FOOD_FEEDBACK,
                    String.valueOf(entryId)
            );
        });

        return saved;
    }
}
