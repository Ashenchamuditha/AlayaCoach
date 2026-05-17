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
    private final NotificationService notificationService;

    /**
     * Validate that sender and receiver can exchange messages.
     * Rule: A COACH can chat with any CLIENT.
     *       A CLIENT must be assigned to the COACH they are chatting with.
     */
    private void validateChatAuthorization(User sender, User receiver) {
        if (sender == null || receiver == null || sender.getRole() == null || receiver.getRole() == null) {
            throw new AccessDeniedException("Invalid user or role for chat");
        }

        boolean valid = switch (sender.getRole()) {
            case COACH -> receiver.getRole() == com.alaya.model.Role.CLIENT;
            case CLIENT -> sender.getCoachId() != null
                           && sender.getCoachId().equals(receiver.getId());
        };
        if (!valid) {
            throw new AccessDeniedException(
                "Chat is only allowed between a coach and a client");
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

        // Push message in real-time to BOTH sender and receiver
        // This ensures the sender's UI updates correctly when using REST fallback
        messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/messages",
                dto
        );
        
        if (!senderId.equals(receiverId)) {
            messagingTemplate.convertAndSendToUser(
                    receiver.getEmail(),
                    "/queue/messages",
                    dto
            );

            // Create notification for receiver
            notificationService.createNotification(
                    receiverId,
                    "New Message from " + sender.getFullName(),
                    content.length() > 50 ? content.substring(0, 47) + "..." : content,
                    com.alaya.model.Notification.NotificationType.MESSAGE,
                    String.valueOf(senderId)
            );
        }

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
