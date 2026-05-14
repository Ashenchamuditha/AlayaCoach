package com.alaya.service;

import com.alaya.model.Goal;
import com.alaya.model.User;
import com.alaya.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final GoalRepository goalRepository;
    private final CheckinRepository checkinRepository;
    private final ChatMessageRepository chatMessageRepository;

    public Map<String, Object> getCoachDashboard(Long coachId) {
        List<User> clients       = userRepository.findAllByCoachId(coachId);
        List<Goal> allGoals      = goalRepository.findAllByCoachId(coachId);
        long completedGoals      = allGoals.stream()
                .filter(g -> g.getStatus() == Goal.GoalStatus.COMPLETED).count();
        return Map.of(
            "totalClients",    clients.size(),
            "totalGoals",      allGoals.size(),
            "completedGoals",  completedGoals,
            "activeGoals",     allGoals.size() - completedGoals,
            "clients",         clients.stream().map(c -> Map.of(
                "id", c.getId(), "name", c.getFullName(), "email", c.getEmail()
            )).toList()
        );
    }

    public Map<String, Object> getClientDashboard(Long clientId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));
        
        List<Goal> goals = goalRepository.findAllByClientId(clientId);
        var recentCheckins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(clientId);
        
        String coachName = "No coach assigned";
        String coachId = "";
        if (client.getCoachId() != null) {
            User coach = userRepository.findById(client.getCoachId()).orElse(null);
            if (coach != null) {
                coachName = coach.getFullName();
                coachId = String.valueOf(coach.getId());
            }
        }

        // Mocking streak and weekly for now, but in the right format
        List<Map<String, Object>> weekly = List.of(
            Map.of("day", "Mon", "score", 65),
            Map.of("day", "Tue", "score", 70),
            Map.of("day", "Wed", "score", 85),
            Map.of("day", "Thu", "score", 80),
            Map.of("day", "Fri", "score", 90),
            Map.of("day", "Sat", "score", 75),
            Map.of("day", "Sun", "score", 95)
        );

        return Map.of(
            "goals", goals.stream().map(g -> Map.of(
                "id", String.valueOf(g.getId()),
                "title", g.getTitle(),
                "done", g.getStatus() == Goal.GoalStatus.COMPLETED,
                "category", g.getCategory() != null ? g.getCategory() : "",
                "priority", g.getPriority().name().toLowerCase()
            )).toList(),
            "aiFeedback", recentCheckins.isEmpty() ? "Welcome! Start by completing your first goal to get AI feedback." : recentCheckins.get(0).getAiFeedback() != null ? recentCheckins.get(0).getAiFeedback() : "Good job! Keep it up.",
            "streak", 5, // Mock streak
            "weekly", weekly,
            "coachId", coachId,
            "coachName", coachName
        );
    }

    public List<Map<String, Object>> getCoachClients(Long coachId) {
        List<User> clients = userRepository.findAllByCoachId(coachId);
        return clients.stream().map(c -> {
            List<Goal> goals = goalRepository.findAllByClientId(c.getId());
            long completed = goals.stream().filter(g -> g.getStatus() == Goal.GoalStatus.COMPLETED).count();
            int completionRate = goals.isEmpty() ? 0 : (int) ((completed * 100) / goals.size());
            
            return (Map<String, Object>) Map.of(
                "id", String.valueOf(c.getId()),
                "name", c.getFullName(),
                "streak", 7, // Mock
                "completion", completionRate,
                "lastActive", "2h ago", // Mock
                "weekly", List.of(
                    Map.of("day", "Mon", "score", 80),
                    Map.of("day", "Tue", "score", 75),
                    Map.of("day", "Wed", "score", 90)
                )
            );
        }).toList();
    }
}
