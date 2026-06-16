package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "checkins", indexes = {
    @Index(name = "idx_checkin_client_id", columnList = "clientId"),
    @Index(name = "idx_checkin_goal_id", columnList = "goalId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Checkin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    private Long goalId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String note;

    @Column(nullable = false)
    private boolean completed;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime checkinTime = LocalDateTime.now();

    @Column(name = "date")
    @Builder.Default
    private java.time.LocalDate date = java.time.LocalDate.now();

    @Column(nullable = false)
    @Builder.Default
    private String status = "COMPLETED";

    // AI-generated feedback stored here after Groq call
    @Column(columnDefinition = "TEXT")
    private String aiFeedback;
}
