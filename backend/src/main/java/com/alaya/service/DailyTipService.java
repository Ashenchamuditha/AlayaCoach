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
        List<DailyTip> tips = dailyTipRepository.findAllByUserIdAndDate(userId, today);
        
        if (tips.isEmpty()) {
            tips = generateAndSaveTips(userId, today);
        }
        
        return tips;
    }

    @Transactional
    public List<DailyTip> generateAndSaveTips(Long userId, LocalDate date) {
        // Gather context
        List<FoodEntry> foods = foodEntryRepository.findAllByClientIdOrderByEntryTimeDesc(userId).stream().limit(5).collect(Collectors.toList());
        List<Checkin> checkins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(userId);
        List<AIChat> chats = aiChatService.getUserHistory(userId).stream().sorted((a, b) -> b.getTimestamp().compareTo(a.getTimestamp())).limit(5).collect(Collectors.toList());

        StringBuilder context = new StringBuilder();
        context.append("Recent Food Logs: ").append(foods.stream().map(f -> f.getFoodName() + "(" + f.getClassification() + ")").collect(Collectors.joining(", "))).append(". ");
        context.append("Recent Checkins: ").append(checkins.stream().map(Checkin::getNote).collect(Collectors.joining(", "))).append(". ");
        context.append("Recent AI Chats: ").append(chats.stream().filter(c -> "user".equals(c.getRole())).map(AIChat::getContent).collect(Collectors.joining(", "))).append(".");

        String json = aiService.generateDailyTips(context.toString());
        List<DailyTip> savedTips = new ArrayList<>();

        try {
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
        } catch (Exception e) {
            log.error("Failed to parse daily tips JSON: {}", e.getMessage());
        }

        return savedTips;
    }
}
