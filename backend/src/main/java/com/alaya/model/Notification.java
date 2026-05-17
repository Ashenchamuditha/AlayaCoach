package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications", indexes = {
    @Index(name = "idx_notification_user_id", columnList = "userId"),
    @Index(name = "idx_notification_is_read", columnList = "isRead")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId; // The recipient

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    private String relatedId; // e.g. goalId, entryId, peerId

    @Column(nullable = false)
    @Builder.Default
    private boolean isRead = false;

    @Column(nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    public enum NotificationType {
        MESSAGE, FOOD_FEEDBACK, GOAL_UPDATE, GOAL_COMPLETE, NEW_CLIENT, AI_SUGGESTION, SYSTEM
    }
}
