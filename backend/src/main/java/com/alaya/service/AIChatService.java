package com.alaya.service;

import com.alaya.model.AIChat;
import com.alaya.repository.AIChatRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AIChatService {

    private final AIChatRepository aiChatRepository;

    public AIChat saveMessage(Long userId, String role, String content) {
        return aiChatRepository.save(AIChat.builder()
                .userId(userId)
                .role(role)
                .content(content)
                .build());
    }

    public List<AIChat> getUserHistory(Long userId) {
        return aiChatRepository.findAllByUserIdOrderByTimestampAsc(userId);
    }

    @Transactional
    public void clearHistory(Long userId) {
        aiChatRepository.deleteAllByUserId(userId);
    }
}
