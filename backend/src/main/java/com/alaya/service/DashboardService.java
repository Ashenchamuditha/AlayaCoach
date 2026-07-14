package com.alaya.service;

import com.alaya.model.ChatMessage;
import com.alaya.model.Checkin;
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
    private final CoachFeedbackRepository coachFeedbackRepository;

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
            map.put("profilePictureUrl", c.getProfilePictureUrl());
            
            ChatMessage lastMsg = chatMessageRepository.findLastMessage(coachId, c.getId());
            map.put("lastMessage", lastMsg != null ? lastMsg.getContent() : "No messages yet");
            
            long unreadCount = chatMessageRepository.countBySenderIdAndReceiverIdAndReadFalse(c.getId(), coachId);
            map.put("unreadCount", unreadCount);
            
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
        
        List<Goal> goals = goalRepository.findAllByClientIdAndDeletedByClientFalseOrderByCreatedAtDesc(clientId);
        var recentCheckins = checkinRepository.findTop5ByClientIdOrderByCheckinTimeDesc(clientId);
        
        String coachName = "No coach assigned";
        String coachProfilePictureUrl = null;
        Object coachIdResponse = null;
        String lastMessageFromCoach = "No messages yet";
        long unreadCount = 0;

        // Auto-assign coach if missing
        if (client.getCoachId() == null) {
            userRepository.findAllByRole(com.alaya.model.Role.COACH).stream()
                    .findFirst()
                    .ifPresent(coach -> {
                        client.setCoachId(coach.getId());
                        userRepository.save(client);
                    });
        }

        if (client.getCoachId() != null) {
            User coach = userRepository.findById(client.getCoachId()).orElse(null);
            if (coach != null) {
                coachName = coach.getFullName();
                coachProfilePictureUrl = coach.getProfilePictureUrl();
                coachIdResponse = String.valueOf(coach.getId());
                
                ChatMessage lastMsg = chatMessageRepository.findLastMessage(clientId, coach.getId());
                if (lastMsg != null) {
                    lastMessageFromCoach = lastMsg.getContent();
                }
                
                unreadCount = chatMessageRepository.countBySenderIdAndReceiverIdAndReadFalse(coach.getId(), clientId);
            }
        }

        // Real weekly progress based on ALL checkins
        List<Map<String, Object>> weekly = calculateWeeklyProgress(clientId);

        Map<String, Object> response = new java.util.HashMap<>();
        response.put("goals", goals.stream().map(g -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", String.valueOf(g.getId()));
            map.put("title", g.getTitle() != null ? g.getTitle() : "Untitled");
            map.put("description", g.getDescription() != null ? g.getDescription() : "");
            map.put("done", g.getStatus() == Goal.GoalStatus.COMPLETED);
            map.put("category", g.getCategory() != null ? g.getCategory() : "");
            map.put("priority", g.getPriority() != null ? g.getPriority().name().toLowerCase() : "medium");
            map.put("dueDate", g.getDueDate());
            map.put("startTime", g.getStartTime());
            map.put("endTime", g.getEndTime());
            map.put("durationMinutes", g.getDurationMinutes());
            map.put("targetValue", g.getTargetValue());
            map.put("targetUnit", g.getTargetUnit());
            map.put("createdAt", g.getCreatedAt());
            map.put("updatedAt", g.getUpdatedAt());
            map.put("coachFeedback", g.getCoachFeedback());
            map.put("createdByCoach", g.isCreatedByCoach());
            map.put("coachViewed", g.isCoachViewed());
            map.put("deletedByClient", g.isDeletedByClient());
            return map;
        }).toList());
        response.put("aiFeedback", recentCheckins.isEmpty() ? "Welcome! Start by completing your first goal to get AI feedback." : recentCheckins.get(0).getAiFeedback() != null ? recentCheckins.get(0).getAiFeedback() : "Good job! Keep it up.");
        response.put("recentCheckins", recentCheckins.stream().map(c -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", String.valueOf(c.getId()));
            map.put("note", c.getNote());
            map.put("checkinTime", c.getCheckinTime());
            map.put("aiFeedback", c.getAiFeedback());
            
            // Add coach feedback
            var feedback = coachFeedbackRepository.findAllByCheckinId(c.getId());
            map.put("coachFeedback", feedback.stream().map(com.alaya.model.CoachFeedback::getFeedbackText).toList());
            
            return map;
        }).toList());
        response.put("weekly", weekly);
        response.put("coachId", coachIdResponse);
        response.put("coachName", coachName);
        response.put("coachProfilePictureUrl", coachProfilePictureUrl);
        response.put("lastMessage", lastMessageFromCoach);
        response.put("unreadCount", unreadCount);

        return response;
    }

    private List<Map<String, Object>> calculateWeeklyProgress(Long clientId) {
        var allCheckins = checkinRepository.findAllByClientIdOrderByCheckinTimeDesc(clientId);
        var allGoals = goalRepository.findAllByClientIdOrderByCreatedAtDesc(clientId);
        List<Map<String, Object>> weekly = new java.util.ArrayList<>();
        
        for (int i = 6; i >= 0; i--) {
            java.time.LocalDate date = java.time.LocalDate.now().minusDays(i);
            
            // Count checkins for this day
            var dayCheckins = allCheckins.stream()
                    .filter(ch -> ch.getCheckinTime().toLocalDate().equals(date))
                    .toList();
            
            long checkinCount = dayCheckins.size();
            long checkinCompletions = dayCheckins.stream().filter(Checkin::isCompleted).count();
            
            // Retroactive: Count goals completed on this day (if they don't have a checkin)
            long historicalCompletions = allGoals.stream()
                    .filter(g -> g.getStatus() == Goal.GoalStatus.COMPLETED 
                            && g.getCompletedAt() != null 
                            && g.getCompletedAt().toLocalDate().equals(date))
                    .count();
            
            // Avoid double counting if a goal completion already has a checkin
            long totalCompletions = Math.max(checkinCompletions, historicalCompletions);
            
            // More nuanced score: base activity + weight for completions
            // Each checkin = 25 pts, each completion = 50 pts, max 100
            long score = Math.min(100, (checkinCount * 25) + (totalCompletions * 50));
            
            // Ensure at least a tiny bit shows if there's ANY activity
            if ((checkinCount > 0 || totalCompletions > 0) && score < 15) score = 15;

            String dayName = date.getDayOfWeek().name().substring(0, 3);
            dayName = dayName.charAt(0) + dayName.substring(1).toLowerCase();
            
            weekly.add(Map.of(
                "day", dayName,
                "score", score
            ));
        }
        return weekly;
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
            List<Goal> goals = goalRepository.findAllByClientIdOrderByCreatedAtDesc(c.getId());
            long completed = goals.stream().filter(g -> g.getStatus() == Goal.GoalStatus.COMPLETED).count();
            long activeGoals = goals.size() - completed;
            int completionRate = goals.isEmpty() ? 0 : (int) ((completed * 100) / goals.size());
            
            var recentCheckins = checkinRepository.findAllByClientIdOrderByCheckinTimeDesc(c.getId());

            Map<String, Object> clientMap = new java.util.HashMap<>();
            clientMap.put("id", String.valueOf(c.getId()));
            clientMap.put("name", c.getFullName() != null ? c.getFullName() : "Unknown");
            clientMap.put("completion", completionRate);
            clientMap.put("activeGoals", activeGoals);
            clientMap.put("lastActive", recentCheckins.isEmpty() ? "Never" : "Recent"); // Simple for now
            
            clientMap.put("recentCheckins", recentCheckins.stream().limit(5).map(ch -> {
                Map<String, Object> map = new java.util.HashMap<>();
                map.put("id", String.valueOf(ch.getId()));
                map.put("note", ch.getNote());
                map.put("checkinTime", ch.getCheckinTime());
                map.put("aiFeedback", ch.getAiFeedback());

                // Add coach feedback
                var feedback = coachFeedbackRepository.findAllByCheckinId(ch.getId());
                map.put("coachFeedback", feedback.stream().map(com.alaya.model.CoachFeedback::getFeedbackText).toList());

                return map;
            }).toList());

            ChatMessage lastMsg = chatMessageRepository.findLastMessage(coachId, c.getId());
            clientMap.put("lastMessage", lastMsg != null ? lastMsg.getContent() : "No messages yet");
            
            long unreadCount = chatMessageRepository.countBySenderIdAndReceiverIdAndReadFalse(c.getId(), coachId);
            clientMap.put("unreadCount", unreadCount);

            // Real weekly progress based on checkins
            clientMap.put("weekly", calculateWeeklyProgress(c.getId()));
            clientMap.put("profilePictureUrl", c.getProfilePictureUrl());
            
            return clientMap;
        }).toList();
    }
}
