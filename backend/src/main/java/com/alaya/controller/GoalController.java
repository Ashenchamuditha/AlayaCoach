package com.alaya.controller;

import com.alaya.model.Goal;
import com.alaya.model.Role;
import com.alaya.model.User;
import com.alaya.service.CheckinService;
import com.alaya.service.GoalService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;
    private final CheckinService checkinService;

    @Data
    public static class GoalRequest {
        private String title;
        private String description;
        private Long clientId;
        private String category;
        private String priority;
        private String dueDate;
        private String endDate;
        private Integer durationMinutes;
        private String startTime;
        private String endTime;
        private Double targetValue;
        private String targetUnit;
    }

    @Data
    public static class CoachFeedbackRequest {
        private String feedback;
    }

    @PostMapping
    public ResponseEntity<Goal> createGoal(@RequestBody GoalRequest req,
                                           @AuthenticationPrincipal User user) {
        Long clientId = (user.getRole() == Role.CLIENT) ? user.getId() : req.getClientId();
        Long coachId  = (user.getRole() == Role.COACH) ? user.getId() : user.getCoachId();
        
        if (coachId == null) coachId = 1L; 

        // Map endDate to dueDate if dueDate is null or empty
        String finalDate = (req.getDueDate() != null && !req.getDueDate().isBlank()) 
                           ? req.getDueDate() 
                           : req.getEndDate();

        Goal goal = goalService.createGoal(
            req.getTitle(), 
            req.getDescription(), 
            clientId, 
            coachId,
            req.getCategory(),
            req.getPriority(),
            finalDate,
            req.getDurationMinutes(),
            req.getStartTime(),
            req.getEndTime(),
            req.getTargetValue(),
            req.getTargetUnit(),
            user.getId()
        );

        // Auto-log a checkin for the new goal to get initial AI feedback
        if (user.getRole() == Role.CLIENT) {
            try {
                checkinService.logCheckin(user.getId(), goal.getId(), "Started a new goal: " + goal.getTitle(), false);
            } catch (Exception e) {
                System.err.println("Failed to log initial checkin for new goal: " + e.getMessage());
            }
        }

        return ResponseEntity.ok(goal);
    }

    @PutMapping("/{goalId}")
    public ResponseEntity<Goal> updateGoal(@PathVariable Long goalId,
                                           @RequestBody GoalRequest req,
                                           @AuthenticationPrincipal User user) {
        // Map endDate to dueDate if dueDate is null or empty
        String finalDate = (req.getDueDate() != null && !req.getDueDate().isBlank()) 
                           ? req.getDueDate() 
                           : req.getEndDate();
        return ResponseEntity.ok(goalService.updateGoal(
            goalId,
            req.getTitle(),
            req.getDescription(),
            req.getCategory(),
            req.getPriority(),
            finalDate,
            req.getDurationMinutes(),
            req.getStartTime(),
            req.getEndTime(),
            req.getTargetValue(),
            req.getTargetUnit(),
            user.getId()
        ));
    }

    @PatchMapping("/{goalId}/toggle")
    public ResponseEntity<Goal> toggleStatus(@PathVariable Long goalId,
                                             @RequestParam boolean completed,
                                             @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(goalService.toggleGoalStatus(goalId, completed, user.getId()));
    }

    @DeleteMapping("/{goalId}")
    public ResponseEntity<Void> deleteGoal(@PathVariable Long goalId,
                                           @AuthenticationPrincipal User user) {
        goalService.deleteGoal(goalId, user.getId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/my")
    public ResponseEntity<List<Goal>> myGoals(@AuthenticationPrincipal User user) {
        List<Goal> goals = switch (user.getRole()) {
            case COACH  -> goalService.getGoalsForCoach(user.getId());
            case CLIENT -> goalService.getGoalsForClient(user.getId());
        };
        return ResponseEntity.ok(goals);
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<List<Goal>> getClientGoals(@PathVariable Long clientId) {
        return ResponseEntity.ok(goalService.getGoalsForClientForCoach(clientId));
    }

    @PatchMapping("/{goalId}/complete")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Goal> completeGoal(@PathVariable Long goalId,
                                             @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(goalService.completeGoal(goalId, coach.getId()));
    }

    @PatchMapping("/{goalId}/viewed")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Goal> markAsViewed(@PathVariable Long goalId,
                                             @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(goalService.markAsViewed(goalId, coach.getId()));
    }

    @PatchMapping("/{goalId}/restore")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Goal> restoreGoal(@PathVariable Long goalId,
                                            @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(goalService.restoreGoal(goalId, coach.getId()));
    }

    @PostMapping("/{goalId}/feedback")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Goal> addFeedback(@PathVariable Long goalId,
                                            @RequestBody CoachFeedbackRequest req,
                                            @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(goalService.addCoachFeedback(goalId, req.getFeedback(), coach.getId()));
    }

    @DeleteMapping("/{goalId}/feedback")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Goal> deleteFeedback(@PathVariable Long goalId,
                                               @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(goalService.deleteCoachFeedback(goalId, coach.getId()));
    }
}
