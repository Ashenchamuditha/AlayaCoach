package com.alaya.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.alaya.model.FoodEntry;
import com.alaya.repository.FoodEntryRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

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

    public FoodEntry logFoodEntry(Long clientId, String foodName, String portion) {
        String aiJson = aiService.generateFoodFeedback(foodName, portion);
        
        Integer estimatedCalories = 0;
        String advice = "That's a good choice! Keep monitoring your portions.";

        try {
            JsonNode node = objectMapper.readTree(aiJson);
            estimatedCalories = node.get("calories").asInt();
            advice = node.get("feedback").asText();
        } catch (Exception e) {
            log.error("Failed to parse AI food feedback: {}", e.getMessage());
        }

        FoodEntry entry = FoodEntry.builder()
                .clientId(clientId)
                .foodName(foodName)
                .portion(portion)
                .calories(estimatedCalories)
                .aiFeedback(advice)
                .build();
        
        return foodEntryRepository.save(entry);
    }

    public FoodEntry logFoodWithImage(Long clientId, MultipartFile file) {
        String fileName = fileStorageService.storeFile(file);
        String imageUrl = "/uploads/food/" + fileName;

        String base64Image;
        try {
            base64Image = Base64.getEncoder().encodeToString(file.getBytes());
        } catch (Exception e) {
            throw new RuntimeException("Could not read file for AI analysis", e);
        }

        String aiJson = aiService.analyzeFoodImage(base64Image);
        
        String foodName = "Uploaded Food";
        Integer calories = 0;
        String advice = "Analysis failed. Please log manually.";

        try {
            JsonNode node = objectMapper.readTree(aiJson);
            foodName = node.get("foodName").asText();
            calories = node.get("calories").asInt();
            advice = node.get("feedback").asText();
        } catch (Exception e) {
            log.error("Failed to parse AI vision feedback: {}", e.getMessage());
        }

        FoodEntry entry = FoodEntry.builder()
                .clientId(clientId)
                .foodName(foodName)
                .calories(calories)
                .aiFeedback(advice)
                .imageUrl(imageUrl)
                .build();
        
        return foodEntryRepository.save(entry);
    }

    public List<FoodEntry> getClientFoodEntries(Long clientId) {
        return foodEntryRepository.findAllByClientIdOrderByEntryTimeDesc(clientId);
    }

    public FoodEntry addCoachFeedback(Long entryId, String feedback) {
        FoodEntry entry = foodEntryRepository.findById(entryId)
                .orElseThrow(() -> new RuntimeException("Food entry not found"));
        entry.setCoachFeedback(feedback);
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
