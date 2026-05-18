package com.alaya.service;

import com.alaya.model.Goal;
import com.alaya.model.User;
import com.alaya.repository.GoalRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CheckinService checkinService;
    private final NotificationService notificationService;

    private void notifyUpdate(Goal goal) {
        try {
            User client = userRepository.findById(goal.getClientId()).orElse(null);
            User coach = userRepository.findById(goal.getCoachId()).orElse(null);
            
            Map<String, Object> update = new java.util.HashMap<>();
            update.put("type", "GOAL_UPDATE");
            update.put("goalId", goal.getId());
            update.put("status", goal.getStatus());
            update.put("clientId", goal.getClientId());

            if (client != null) {
                messagingTemplate.convertAndSendToUser(client.getEmail(), "/queue/updates", update);
            }
            if (coach != null) {
                messagingTemplate.convertAndSendToUser(coach.getEmail(), "/queue/updates", update);
            }
        } catch (Exception e) {
            System.err.println("Failed to send WebSocket update: " + e.getMessage());
        }
    }

    public Goal createGoal(String title, String description, Long clientId, Long coachId, 
                           String category, String priority, String dueDate, Integer durationMinutes,
                           String startTime, String endTime, Double targetValue, String targetUnit,
                           Long creatorId) {
        
        LocalDateTime parsedDueDate = null;
        if (dueDate != null && !dueDate.isBlank()) {
            try {
                String dateStr = dueDate;
                if (dateStr.length() == 10) dateStr += "T23:59:59";
                if (dateStr.endsWith("Z")) dateStr = dateStr.substring(0, dateStr.length() - 1);
                parsedDueDate = LocalDateTime.parse(dateStr);
            } catch (Exception e) {
                System.err.println("Failed to parse date: " + dueDate + " Error: " + e.getMessage());
            }
        }

        Goal.GoalPriority p = Goal.GoalPriority.MEDIUM;
        if (priority != null && !priority.isBlank()) {
            try { p = Goal.GoalPriority.valueOf(priority.toUpperCase()); } catch (Exception e) {}
        }

        Goal goal = goalRepository.save(Goal.builder()
                .title(title)
                .description(description)
                .clientId(clientId)
                .coachId(coachId)
                .category(category)
                .priority(p)
                .dueDate(parsedDueDate)
                .durationMinutes(durationMinutes)
                .startTime(startTime)
                .endTime(endTime)
                .targetValue(targetValue != null ? targetValue : 0.0)
                .targetUnit(targetUnit != null ? targetUnit : "")
                .build());
        
        // Notify client if the goal was created by their coach
        if (creatorId != null && !creatorId.equals(clientId)) {
            notificationService.createNotification(
                    clientId,
                    "New Goal Assigned",
                    "Your coach has assigned a new goal to you: " + title,
                    com.alaya.model.Notification.NotificationType.GOAL_UPDATE,
                    String.valueOf(goal.getId())
            );
        }

        notifyUpdate(goal);
        return goal;
    }

    public Goal updateGoal(Long goalId, String title, String description, String category, String priority, 
                           String dueDate, Integer durationMinutes, String startTime, String endTime, 
                           Double targetValue, String targetUnit, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        // Only the client or their coach can update
        if (!goal.getClientId().equals(userId) && !goal.getCoachId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to update this goal");
        }

        if (title != null) goal.setTitle(title);
        if (description != null) goal.setDescription(description);
        if (category != null) goal.setCategory(category);
        if (priority != null) {
            try { goal.setPriority(Goal.GoalPriority.valueOf(priority.toUpperCase())); } catch (Exception e) {}
        }
        if (dueDate != null && !dueDate.isBlank()) {
            try {
                if (dueDate.length() == 10) dueDate += "T23:59:59";
                goal.setDueDate(LocalDateTime.parse(dueDate.endsWith("Z") ? dueDate.substring(0, dueDate.length()-1) : dueDate));
            } catch (Exception e) {}
        }
        if (durationMinutes != null) goal.setDurationMinutes(durationMinutes);
        if (startTime != null) goal.setStartTime(startTime);
        if (endTime != null) goal.setEndTime(endTime);
        if (targetValue != null) goal.setTargetValue(targetValue);
        if (targetUnit != null) goal.setTargetUnit(targetUnit);

        goal.setUpdatedAt(LocalDateTime.now());
        Goal saved = goalRepository.save(goal);
        notifyUpdate(saved);
        return saved;
    }

    public void deleteGoal(Long goalId, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        // Both coach and client can delete their own goals
        if (!goal.getClientId().equals(userId) && !goal.getCoachId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to delete this goal");
        }
        
        goalRepository.delete(goal);
        
        // Notify of deletion
        try {
            User client = userRepository.findById(goal.getClientId()).orElse(null);
            User coach = userRepository.findById(goal.getCoachId()).orElse(null);
            Map<String, Object> update = new java.util.HashMap<>();
            update.put("type", "GOAL_DELETED");
            update.put("goalId", goalId);
            update.put("clientId", goal.getClientId());
            if (client != null) messagingTemplate.convertAndSendToUser(client.getEmail(), "/queue/updates", update);
            if (coach != null) messagingTemplate.convertAndSendToUser(coach.getEmail(), "/queue/updates", update);
        } catch (Exception e) {}
    }

    public List<Goal> getGoalsForClient(Long clientId) {
        return goalRepository.findAllByClientIdOrderByCreatedAtDesc(clientId);
    }

    public List<Goal> getGoalsForCoach(Long coachId) {
        return goalRepository.findAllByCoachIdOrderByCreatedAtDesc(coachId);
    }

    public Goal toggleGoalStatus(Long goalId, boolean completed, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        if (!goal.getClientId().equals(userId) && !goal.getCoachId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to update this goal");
        }

        if (completed) {
            goal.setStatus(Goal.GoalStatus.COMPLETED);
            goal.setCompletedAt(LocalDateTime.now());
            // Log checkin for progress charts
            checkinService.logCheckin(goal.getClientId(), goal.getId(), "Goal marked as completed: " + goal.getTitle(), true);
            
            // Notify coach about goal completion if done by client
            if (userId.equals(goal.getClientId())) {
                notificationService.createNotification(
                        goal.getCoachId(),
                        "Goal Completed",
                        "Client has completed the goal: " + goal.getTitle(),
                        com.alaya.model.Notification.NotificationType.GOAL_COMPLETE,
                        String.valueOf(goal.getId())
                );
            }
        } else {
            goal.setStatus(Goal.GoalStatus.ACTIVE);
            goal.setCompletedAt(null);
        }
        goal.setUpdatedAt(LocalDateTime.now());
        Goal saved = goalRepository.save(goal);
        notifyUpdate(saved);
        return saved;
    }

    public Goal completeGoal(Long goalId, Long coachId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        if (!goal.getCoachId().equals(coachId)) {
            throw new AccessDeniedException("Not authorized to update this goal");
        }
        goal.setStatus(Goal.GoalStatus.COMPLETED);
        goal.setCompletedAt(LocalDateTime.now());
        goal.setUpdatedAt(LocalDateTime.now());
        // Log checkin
        checkinService.logCheckin(goal.getClientId(), goal.getId(), "Coach completed goal: " + goal.getTitle(), true);
        
        // Notify client that coach completed the goal
        notificationService.createNotification(
                goal.getClientId(),
                "Goal Completed by Coach",
                "Your coach has marked the goal '" + goal.getTitle() + "' as completed. Great job!",
                com.alaya.model.Notification.NotificationType.GOAL_COMPLETE,
                String.valueOf(goal.getId())
        );

        Goal saved = goalRepository.save(goal);
        notifyUpdate(saved);
        return saved;
    }

    public Goal addCoachFeedback(Long goalId, String feedback, Long coachId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        if (!goal.getCoachId().equals(coachId)) {
            throw new AccessDeniedException("Only the assigned coach can provide feedback on this goal");
        }

        goal.setCoachFeedback(feedback);
        goal.setUpdatedAt(LocalDateTime.now());
        Goal saved = goalRepository.save(goal);
        
        // Notify client about new goal feedback
        notificationService.createNotification(
                saved.getClientId(),
                "New Coach Feedback on Goal",
                "Your coach left feedback on your goal: " + saved.getTitle(),
                com.alaya.model.Notification.NotificationType.GOAL_UPDATE,
                String.valueOf(goalId)
        );

        notifyUpdate(saved);
        return saved;
    }

    public Goal deleteCoachFeedback(Long goalId, Long coachId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        if (!goal.getCoachId().equals(coachId)) {
            throw new AccessDeniedException("Only the assigned coach can delete feedback on this goal");
        }

        goal.setCoachFeedback(null);
        goal.setUpdatedAt(LocalDateTime.now());
        Goal saved = goalRepository.save(goal);
        notifyUpdate(saved);
        return saved;
    }
}
