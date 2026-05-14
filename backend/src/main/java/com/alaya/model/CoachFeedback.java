package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "coach_feedback", indexes = {
    @Index(name = "idx_feedback_checkin_id", columnList = "checkinId"),
    @Index(name = "idx_feedback_coach_id", columnList = "coachId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CoachFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long checkinId;

    @Column(nullable = false)
    private Long coachId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String feedbackText;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
