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
        if (coachId == null) {
            Map<String, Object> emptyMap = new java.util.HashMap<>();
            emptyMap.put("totalClients", 0);
            emptyMap.put("totalGoals", 0);
            emptyMap.put("completedGoals", 0);
            emptyMap.put("activeGoals", 0);
            emptyMap.put("clients", List.of());
            return emptyMap;
        }

        List<User> clients = userRepository.findAllByRole(com.alaya.model.Role.CLIENT);
        List<Goal> allGoals = goalRepository.findAllByCoachId(coachId);
        long completedGoals = allGoals.stream()
                .filter(g -> g.getStatus() == Goal.GoalStatus.COMPLETED).count();

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("totalClients", clients.size());
        response.put("totalGoals", allGoals.size());
        response.put("completedGoals", completedGoals);
        response.put("activeGoals", allGoals.size() - completedGoals);
        response.put("clients", clients.stream().map(c -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", String.valueOf(c.getId()));
            map.put("name", c.getFullName() != null ? c.getFullName() : "Unknown");
            map.put("email", c.getEmail() != null ? c.getEmail() : "");
            return map;
        }).toList());

        return response;
    }

    public Map<String, Object> getClientDashboard(Long clientId) {
        if (clientId == null) {
            throw new IllegalArgumentException("Client ID cannot be null");
        }
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new IllegalArgumentException("Client not found"));
        
        List<Goal> goals = goalRepository.findAllByClientId(clientId);
        var recentCheckins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(clientId);
        
        String coachName = "No coach assigned";
        String coachIdStr = "";
        if (client.getCoachId() != null) {
            User coach = userRepository.findById(client.getCoachId()).orElse(null);
            if (coach != null) {
                coachName = coach.getFullName();
                coachIdStr = String.valueOf(coach.getId());
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
            "goals", goals.stream().map(g -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", String.valueOf(g.getId()));
                map.put("title", g.getTitle() != null ? g.getTitle() : "Untitled");
                map.put("done", g.getStatus() == Goal.GoalStatus.COMPLETED);
                map.put("category", g.getCategory() != null ? g.getCategory() : "");
                map.put("priority", g.getPriority() != null ? g.getPriority().name().toLowerCase() : "medium");
                return map;
            }).toList(),
            "aiFeedback", recentCheckins.isEmpty() ? "Welcome! Start by completing your first goal to get AI feedback." : recentCheckins.get(0).getAiFeedback() != null ? recentCheckins.get(0).getAiFeedback() : "Good job! Keep it up.",
            "streak", 5, // Mock streak
            "weekly", weekly,
            "coachId", coachIdStr,
            "coachName", coachName
        );
    }

    public List<Map<String, Object>> getCoachClients(Long coachId) {
        if (coachId == null) {
            return List.of();
        }

        // Fetch all users with role CLIENT. 
        // In this setup, we want coaches to see all clients so they can manage them.
        List<User> clients = userRepository.findAllByRole(com.alaya.model.Role.CLIENT);
        
        System.out.println("DEBUG: Found " + clients.size() + " clients for coach " + coachId);

        return clients.stream().map(c -> {
            List<Goal> goals = goalRepository.findAllByClientId(c.getId());
            long completed = goals.stream().filter(g -> g.getStatus() == Goal.GoalStatus.COMPLETED).count();
            int completionRate = goals.isEmpty() ? 0 : (int) ((completed * 100) / goals.size());
            
            Map<String, Object> clientMap = new java.util.HashMap<>();
            clientMap.put("id", String.valueOf(c.getId()));
            clientMap.put("name", c.getFullName() != null ? c.getFullName() : "Unknown");
            clientMap.put("streak", 7); // Mock
            clientMap.put("completion", completionRate);
            clientMap.put("lastActive", "2h ago"); // Mock
            clientMap.put("weekly", List.of(
                Map.of("day", "Mon", "score", 80),
                Map.of("day", "Tue", "score", 75),
                Map.of("day", "Wed", "score", 90),
                Map.of("day", "Thu", "score", 85),
                Map.of("day", "Fri", "score", 95),
                Map.of("day", "Sat", "score", 70),
                Map.of("day", "Sun", "score", 88)
            ));
            
            return clientMap;
        }).toList();
    }
}
