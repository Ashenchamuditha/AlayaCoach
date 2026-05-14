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
                           String startTime, String endTime) {
        
        LocalDateTime parsedDueDate = null;
        if (dueDate != null && !dueDate.isBlank()) {
            try {
                parsedDueDate = LocalDateTime.parse(dueDate.endsWith("Z") ? dueDate.substring(0, dueDate.length()-1) : dueDate);
            } catch (Exception e) {
                // fallback or ignore
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
                .build());
    }

    public Goal updateGoal(Long goalId, String title, String description, String category, String priority, 
                           String dueDate, Integer durationMinutes, String startTime, String endTime, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
        // Only the client or their coach can update
        if (!goal.getClientId().equals(userId) && !goal.getCoachId().equals(userId)) {
            throw new AccessDeniedException("Not authorized to update this goal");
        }

        goal.setTitle(title);
        goal.setDescription(description);
        goal.setCategory(category);
        if (priority != null) {
            try { goal.setPriority(Goal.GoalPriority.valueOf(priority.toUpperCase())); } catch (Exception e) {}
        }
        if (dueDate != null && !dueDate.isBlank()) {
            try {
                goal.setDueDate(LocalDateTime.parse(dueDate.endsWith("Z") ? dueDate.substring(0, dueDate.length()-1) : dueDate));
            } catch (Exception e) {}
        }
        goal.setDurationMinutes(durationMinutes);
        goal.setStartTime(startTime);
        goal.setEndTime(endTime);

        return goalRepository.save(goal);
    }

    public void deleteGoal(Long goalId, Long userId) {
        Goal goal = goalRepository.findById(goalId)
                .orElseThrow(() -> new IllegalArgumentException("Goal not found"));
        
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
