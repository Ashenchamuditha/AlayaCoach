package com.alaya.repository;

import com.alaya.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {

    /**
     * Fetch full conversation between two users, ordered chronologically.
     * Uses the composite index on (senderId, receiverId, timestamp).
     */
    @Query("""
        SELECT m FROM ChatMessage m
        WHERE (m.senderId = :userId AND m.receiverId = :otherId)
           OR (m.senderId = :otherId AND m.receiverId = :userId)
        ORDER BY m.timestamp ASC
        """)
    List<ChatMessage> findConversation(@Param("userId") Long userId,
                                       @Param("otherId") Long otherId);

    /**
     * Mark all messages from a sender to a receiver as read.
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE ChatMessage m SET m.read = true
        WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.read = false
        """)
    int markAsRead(@Param("senderId") Long senderId, @Param("receiverId") Long receiverId);

    long countBySenderIdAndReceiverIdAndReadFalse(Long senderId, Long receiverId);
}
