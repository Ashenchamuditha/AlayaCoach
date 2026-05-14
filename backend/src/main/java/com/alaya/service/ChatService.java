package com.alaya.service;

import com.alaya.dto.ChatMessageDto;
import com.alaya.model.ChatMessage;
import com.alaya.model.User;
import com.alaya.repository.ChatMessageRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

/**
 * ChatService handles:
 *  - Authorization: only a coach and their assigned client can exchange messages.
 *  - Persistence: saves ChatMessage to PostgreSQL.
 *  - Real-time delivery: pushes message to receiver's STOMP private queue.
 */
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Validate that sender and receiver are in the same coaching relationship.
     * Either: sender is a coach and receiver is their client,
     *      OR: sender is a client and receiver is their coach.
     */
    private void validateChatAuthorization(User sender, User receiver) {
        boolean valid = switch (sender.getRole()) {
            case COACH -> receiver.getCoachId() != null
                          && receiver.getCoachId().equals(sender.getId());
            case CLIENT -> sender.getCoachId() != null
                           && sender.getCoachId().equals(receiver.getId());
        };
        if (!valid) {
            throw new AccessDeniedException(
                "Chat is only allowed between a coach and their assigned client");
        }
    }

    public ChatMessageDto sendMessage(Long senderId, Long receiverId, String content) {
        User sender   = userRepository.findById(senderId)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        validateChatAuthorization(sender, receiver);

        ChatMessage msg = chatMessageRepository.save(ChatMessage.builder()
                .senderId(senderId)
                .receiverId(receiverId)
                .content(content)
                .build());

        ChatMessageDto dto = toDto(msg);

        // Push message in real-time to receiver's private STOMP queue
        // Frontend subscribes to: /user/queue/messages
        messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),  // Spring uses the principal name as user identifier
                "/queue/messages",
                dto
        );

        return dto;
    }

    public void sendMessageByEmail(String senderEmail, Long receiverId, String content) {
        User sender = userRepository.findByEmail(senderEmail)
                .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        sendMessage(sender.getId(), receiverId, content);
    }

    public List<ChatMessageDto> getConversationHistory(Long currentUserId, Long otherUserId) {
        User current = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        User other   = userRepository.findById(otherUserId)
                .orElseThrow(() -> new IllegalArgumentException("Other user not found"));

        validateChatAuthorization(current, other);

        // Mark messages from other user as read
        chatMessageRepository.markAsRead(otherUserId, currentUserId);

        return chatMessageRepository.findConversation(currentUserId, otherUserId)
                .stream().map(this::toDto).collect(Collectors.toList());
    }

    private ChatMessageDto toDto(ChatMessage m) {
        ChatMessageDto dto = new ChatMessageDto();
        dto.setId(m.getId());
        dto.setSenderId(m.getSenderId());
        dto.setReceiverId(m.getReceiverId());
        dto.setContent(m.getContent());
        dto.setTimestamp(m.getTimestamp());
        dto.setRead(m.isRead());
        return dto;
    }
}
