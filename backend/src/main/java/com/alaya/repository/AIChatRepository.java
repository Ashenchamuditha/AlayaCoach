package com.alaya.repository;

import com.alaya.model.AIChat;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AIChatRepository extends JpaRepository<AIChat, Long> {
    List<AIChat> findAllByUserIdOrderByTimestampAsc(Long userId);
    void deleteAllByUserId(Long userId);
}
