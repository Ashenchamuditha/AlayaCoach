package com.alaya.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.alaya.model.*;
import com.alaya.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class WeeklyReportService {

    private final WeeklyReportRepository weeklyReportRepository;
    private final GoalRepository goalRepository;
    private final CheckinRepository checkinRepository;
    private final FoodEntryRepository foodEntryRepository;
    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public Optional<WeeklyReport> getLatestReport(Long clientId) {
        return weeklyReportRepository.findTopByClientIdOrderByEndDateDesc(clientId);
    }

    @Transactional
    public WeeklyReport generateWeeklyReport(Long clientId) {
        LocalDate endDate = LocalDate.now();
        LocalDate startDate = endDate.minusDays(7);

        // Aggregate data
        List<Goal> goals = goalRepository.findAllByClientId(clientId);
        List<Checkin> checkins = checkinRepository.findAllByClientIdOrderByCheckinTimeDesc(clientId).stream()
                .filter(c -> c.getCheckinTime().toLocalDate().isAfter(startDate.minusDays(1)))
                .collect(Collectors.toList());
        List<FoodEntry> foodEntries = foodEntryRepository.findAllByClientIdOrderByEntryTimeDesc(clientId).stream()
                .filter(e -> e.getEntryTime().toLocalDate().isAfter(startDate.minusDays(1)))
                .collect(Collectors.toList());

        StringBuilder dataContext = new StringBuilder();
        dataContext.append("Goals: ").append(goals.stream()
                .map(g -> g.getTitle() + " (" + g.getStatus() + ")")
                .collect(Collectors.joining(", "))).append("\n");
        dataContext.append("Recent Check-ins: ").append(checkins.stream()
                .map(Checkin::getNote)
                .collect(Collectors.joining("; "))).append("\n");
        dataContext.append("Recent Meals: ").append(foodEntries.stream()
                .map(e -> e.getFoodName() + " (" + e.getCalories() + " kcal, " + e.getClassification() + ")")
                .collect(Collectors.joining("; "))).append("\n");

        String aiJsonResponse = aiService.generateWeeklyReportSummary(dataContext.toString());
        
        String clientSummary = "Great job this week! Keep pushing toward your goals.";
        String coachBrief = "The client is making steady progress.";

        try {
            JsonNode node = objectMapper.readTree(aiJsonResponse);
            if (node.has("clientSummary")) {
                clientSummary = node.get("clientSummary").asText();
            }
            if (node.has("coachBrief")) {
                coachBrief = node.get("coachBrief").asText();
            }
        } catch (Exception e) {
            log.error("Failed to parse AI weekly report JSON: {}", e.getMessage());
        }

        WeeklyReport report = WeeklyReport.builder()
                .clientId(clientId)
                .startDate(startDate)
                .endDate(endDate)
                .clientSummary(clientSummary)
                .coachBrief(coachBrief)
                .createdAt(LocalDateTime.now())
                .build();

        return weeklyReportRepository.save(report);
    }
}
