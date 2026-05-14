package com.alaya.service;

import com.alaya.model.Goal;
import com.alaya.model.User;
import com.alaya.repository.GoalRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;

    public Goal createGoal(String title, String description, Long clientId, Long coachId, 
                           String category, String priority, String dueDate, Integer durationMinutes,
                           String startTime, String endTime, Double targetValue, String targetUnit) {
        
        LocalDateTime parsedDueDate = null;
        if (dueDate != null && !dueDate.isBlank()) {
            try {
                // Handle different date formats or simple ISO
                if (dueDate.length() == 10) dueDate += "T23:59:59";
                parsedDueDate = LocalDateTime.parse(dueDate.endsWith("Z") ? dueDate.substring(0, dueDate.length()-1) : dueDate);
            } catch (Exception e) {
                System.err.println("Failed to parse date: " + dueDate);
            }
        }

        Goal.GoalPriority p = Goal.GoalPriority.MEDIUM;
        if (priority != null) {
            try { p = Goal.GoalPriority.valueOf(priority.toUpperCase()); } catch (Exception e) {}
        }

        return goalRepository.save(Goal.builder()
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
                .targetValue(targetValue)
                .targetUnit(targetUnit)
                .build());
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

        return goalRepository.save(goal);
    }

    public void deleteGoal(Long goalId, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        // Both coach and client can delete their own goals
        if (!goal.getClientId().equals(userId) && !goal.getCoachId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to delete this goal");
        }
        
        goalRepository.delete(goal);
    }

    public List<Goal> getGoalsForClient(Long clientId) {
        return goalRepository.findAllByClientId(clientId);
    }

    public List<Goal> getGoalsForCoach(Long coachId) {
        return goalRepository.findAllByCoachId(coachId);
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
        } else {
            goal.setStatus(Goal.GoalStatus.ACTIVE);
            goal.setCompletedAt(null);
        }
        return goalRepository.save(goal);
    }

    public Goal completeGoal(Long goalId, Long coachId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        if (!goal.getCoachId().equals(coachId)) {
            throw new AccessDeniedException("Not authorized to update this goal");
        }
        goal.setStatus(Goal.GoalStatus.COMPLETED);
        goal.setCompletedAt(LocalDateTime.now());
        return goalRepository.save(goal);
    }
}
