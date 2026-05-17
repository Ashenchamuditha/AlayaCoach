package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ai_chats", indexes = {
    @Index(name = "idx_ai_chat_user_id", columnList = "userId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AIChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String role; // "user" or "assistant"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
}
