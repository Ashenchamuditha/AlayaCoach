package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "goals", indexes = {
    @Index(name = "idx_goal_client_id", columnList = "clientId"),
    @Index(name = "idx_goal_coach_id", columnList = "coachId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Goal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(nullable = false)
    private Long clientId;   // The CLIENT this goal is assigned to

    @Column(nullable = false)
    private Long coachId;    // The COACH who created this goal

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GoalStatus status = GoalStatus.ACTIVE;

    private String category;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private GoalPriority priority = GoalPriority.MEDIUM;

    private LocalDateTime dueDate;

    private String startTime;
    private String endTime;

    private Integer durationMinutes;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime completedAt;

    public enum GoalStatus {
        ACTIVE, COMPLETED, CANCELLED
    }

    public enum GoalPriority {
        LOW, MEDIUM, HIGH
    }
}
