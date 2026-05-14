package com.alaya.controller;

import com.alaya.model.Goal;
import com.alaya.model.User;
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

    @Data
    public static class GoalRequest {
        String title;
        String description;
        Long clientId;
        String category;
        String priority;
        String dueDate;
        Integer durationMinutes;
    }

    @PostMapping
    public ResponseEntity<Goal> createGoal(@RequestBody GoalRequest req,
                                           @AuthenticationPrincipal User user) {
        Long clientId = (user.getRole() == com.alaya.model.Role.CLIENT) ? user.getId() : req.getClientId();
        Long coachId  = (user.getRole() == com.alaya.model.Role.COACH) ? user.getId() : user.getCoachId();
        
        // Default to a system/admin coach ID if client has no coach yet (optional logic)
        if (coachId == null) coachId = 1L; 

        Goal goal = goalService.createGoal(
            req.getTitle(), 
            req.getDescription(), 
            clientId, 
            coachId,
            req.getCategory(),
            req.getPriority(),
            req.getDueDate(),
            req.getDurationMinutes()
        );
        return ResponseEntity.ok(goal);
    }

    @GetMapping("/my")
    public ResponseEntity<List<Goal>> myGoals(@AuthenticationPrincipal User user) {
        List<Goal> goals = switch (user.getRole()) {
            case COACH  -> goalService.getGoalsForCoach(user.getId());
            case CLIENT -> goalService.getGoalsForClient(user.getId());
        };
        return ResponseEntity.ok(goals);
    }

    @PatchMapping("/{goalId}/complete")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<Goal> completeGoal(@PathVariable Long goalId,
                                             @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(goalService.completeGoal(goalId, coach.getId()));
    }
}
