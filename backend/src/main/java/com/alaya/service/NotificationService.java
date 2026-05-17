package com.alaya.service;

import com.alaya.model.Notification;
import com.alaya.model.User;
import com.alaya.repository.NotificationRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Notification createNotification(Long userId, String title, String message, 
                                          Notification.NotificationType type, String relatedId) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .relatedId(relatedId)
                .build();
        
        Notification saved = notificationRepository.save(notification);
        
        // Push via WebSocket
        userRepository.findById(userId).ifPresent(user -> {
            messagingTemplate.convertAndSendToUser(
                    user.getEmail(),
                    "/queue/notifications",
                    Map.of(
                        "type", "NEW_NOTIFICATION",
                        "notification", saved
                    )
            );
        });
        
        return saved;
    }

    public List<Notification> getMyNotifications(Long userId) {
        return notificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    public List<Notification> getUnreadNotifications(Long userId) {
        return notificationRepository.findAllByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
    }

    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            if (n.getUserId().equals(userId)) {
                n.setRead(true);
                notificationRepository.save(n);
            }
        });
    }

    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findAllByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }
}
