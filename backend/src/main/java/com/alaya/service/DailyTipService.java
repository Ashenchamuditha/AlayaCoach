package com.alaya.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.alaya.model.DailyTip;
import com.alaya.model.FoodEntry;
import com.alaya.model.Checkin;
import com.alaya.model.AIChat;
import com.alaya.repository.DailyTipRepository;
import com.alaya.repository.FoodEntryRepository;
import com.alaya.repository.CheckinRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class DailyTipService {

    private final DailyTipRepository dailyTipRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final CheckinRepository checkinRepository;
    private final AIChatService aiChatService;
    private final AIService aiService;
    private final ObjectMapper objectMapper;

    public List<DailyTip> getDailyTips(Long userId) {
        LocalDate today = LocalDate.now();
        log.info("Fetching tips for user: {} on date: {}", userId, today);
        List<DailyTip> tips = dailyTipRepository.findAllByUserIdAndDate(userId, today);

        if (tips.isEmpty()) {
            log.info("No tips found for user: {} today. Generating new ones...", userId);
            try {
                tips = generateAndSaveTips(userId, today);
            } catch (Exception e) {
                log.error("Failed to generate tips for user: {}. Error: {}", userId, e.getMessage());
                return new ArrayList<>();
            }
        }

        return tips;
    }

    @Transactional
    public List<DailyTip> generateAndSaveTips(Long userId, LocalDate date) {
        log.info("Generating tips for user: {} for date: {}", userId, date);
        // Gather context
        List<FoodEntry> foods = foodEntryRepository.findAllByClientIdOrderByEntryTimeDesc(userId).stream().limit(5).collect(Collectors.toList());
        List<Checkin> checkins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(userId);
        List<AIChat> chats = aiChatService.getUserHistory(userId).stream().sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp())).limit(5).collect(Collectors.toList());

        StringBuilder context = new StringBuilder();
        if (!foods.isEmpty()) {
            context.append("Recent Food Logs: ").append(foods.stream().map(f -> f.getFoodName() + "(" + f.getClassification() + ")").collect(Collectors.joining(", "))).append(". ");
        }
        if (!checkins.isEmpty()) {
            context.append("Recent Checkins: ").append(checkins.stream().map(Checkin::getNote).collect(Collectors.joining(", "))).append(". ");
        }
        if (!chats.isEmpty()) {
            context.append("Recent AI Chats: ").append(chats.stream().filter(c -> "user".equals(c.getRole())).map(AIChat::getContent).collect(Collectors.joining(", "))).append(".");
        }

        if (context.length() == 0) {
            context.append("No recent activity data available for this user yet.");
        }

        String json = aiService.generateDailyTips(context.toString());
        List<DailyTip> savedTips = new ArrayList<>();

        try {
            log.debug("AI Response for tips: {}", json);
            List<String> tipStrings = objectMapper.readValue(json, new TypeReference<List<String>>() {});

            // Delete old tips for today if any (safety)
            dailyTipRepository.deleteAllByUserIdAndDate(userId, date);

            for (String content : tipStrings) {
                DailyTip tip = DailyTip.builder()
                        .userId(userId)
                        .content(content)
                        .date(date)
                        .build();
                savedTips.add(dailyTipRepository.save(tip));
            }
            log.info("Successfully saved {} tips for user: {}", savedTips.size(), userId);
        } catch (Exception e) {
            log.error("Failed to parse or save daily tips for user: {}. JSON: {}. Error: {}", userId, json, e.getMessage());
        }

        return savedTips;
    }

}
