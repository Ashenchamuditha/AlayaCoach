package com.alaya.service;

import com.alaya.model.Checkin;
import com.alaya.repository.CheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckinService {

    private final CheckinRepository checkinRepository;
    private final com.alaya.repository.GoalRepository goalRepository;
    private final AIService aiService;
    private final NotificationService notificationService;

    /**
     * Saves a check-in and immediately calls Groq AI to generate feedback.
     * AI feedback is stored inline on the Checkin entity.
     */
    public Checkin logCheckin(Long clientId, Long goalId, String note, boolean completed) {
        // Update Goal status if needed
        if (goalId != null && completed) {
            goalRepository.findById(goalId).ifPresent(goal -> {
                goal.setStatus(com.alaya.model.Goal.GoalStatus.COMPLETED);
                goal.setCompletedAt(java.time.LocalDateTime.now());
                goalRepository.save(goal);
            });
        }

        // 1. Get AI feedback synchronously
        String feedback = aiService.generateCheckinFeedback(note);

        // 2. Save checkin with embedded AI feedback
        Checkin checkin = Checkin.builder()
                .clientId(clientId)
                .goalId(goalId)
                .note(note)
                .completed(completed)
                .aiFeedback(feedback)
                .build();
        Checkin saved = checkinRepository.save(checkin);

        // Notify client about new AI feedback
        notificationService.createNotification(
                clientId,
                "New AI Coaching Suggestion",
                "Your AI Coach has analyzed your recent check-in and provided some advice.",
                com.alaya.model.Notification.NotificationType.AI_SUGGESTION,
                String.valueOf(saved.getId())
        );

        return saved;
    }

    public List<Checkin> getClientCheckins(Long clientId) {
        return checkinRepository.findAllByClientIdOrderByCheckinTimeDesc(clientId);
    }
}
