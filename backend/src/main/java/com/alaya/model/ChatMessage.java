package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages", indexes = {
    @Index(name = "idx_chat_sender_id",   columnList = "senderId"),
    @Index(name = "idx_chat_receiver_id", columnList = "receiverId"),
    @Index(name = "idx_chat_timestamp",   columnList = "timestamp"),
    // Composite index for conversation history queries
    @Index(name = "idx_chat_conversation", columnList = "senderId, receiverId, timestamp")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long senderId;

    @Column(nullable = false)
    private Long receiverId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    @Builder.Default
    private boolean read = false;
}
