package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "food_entries", indexes = {
    @Index(name = "idx_food_client_id", columnList = "clientId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class FoodEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private String foodName;

    private String portion; // Optional

    @Column(nullable = false)
    private Integer calories;

    @Column(nullable = false)
    private LocalDateTime entryTime;

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    private String classification; // HEALTHY or UNHEALTHY

    private String chatStarter; // Suggested question for chat

    @Column(columnDefinition = "TEXT")
    private String coachFeedback;

    private String imageUrl;

    @Builder.Default
    private boolean deletedByClient = false;
}
