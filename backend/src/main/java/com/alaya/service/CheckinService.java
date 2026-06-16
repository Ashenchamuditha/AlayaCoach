package com.alaya.service;

import com.alaya.model.Checkin;
import com.alaya.repository.CheckinRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CheckinService {

    private final CheckinRepository checkinRepository;
    private final com.alaya.repository.GoalRepository goalRepository;
    private final AIService aiService;
    private final NotificationService notificationService;

    /**
     * Saves a check-in and immediately calls Groq AI to generate feedback.
     * If a check-in for the same goal already exists for today, it updates it.
     */
    public Checkin logCheckin(Long clientId, Long goalId, String note, boolean completed) {
        // 1. Get AI feedback synchronously
        String feedback = aiService.generateCheckinFeedback(note);
        if (feedback == null) {
            feedback = completed ? "Great job on completing your goal!" : "Keep up the good work!";
        }

        // 2. Check if a check-in for this goal already exists today to avoid unique constraint violations
        LocalDate today = LocalDate.now();
        Optional<Checkin> latest = checkinRepository.findFirstByGoalIdOrderByCheckinTimeDesc(goalId);
        
        Checkin checkin;
        if (latest.isPresent() && today.equals(latest.get().getDate())) {
            // Update existing check-in for today
            checkin = latest.get();
            checkin.setNote(note);
            checkin.setCompleted(completed);
            checkin.setStatus(completed ? "COMPLETED" : "ACTIVE");
            checkin.setAiFeedback(feedback);
            checkin.setCheckinTime(LocalDateTime.now());
        } else {
            // Create new check-in
            checkin = Checkin.builder()
                    .clientId(clientId)
                    .goalId(goalId)
                    .note(note)
                    .completed(completed)
                    .date(today)
                    .status(completed ? "COMPLETED" : "ACTIVE")
                    .aiFeedback(feedback)
                    .build();
        }
        
        Checkin saved = checkinRepository.save(checkin);

        // Notify client about new AI feedback
        notificationService.createNotification(
                clientId,
                "AI Coach Advice",
                feedback,
                com.alaya.model.Notification.NotificationType.AI_SUGGESTION,
                String.valueOf(saved.getId())
        );

        return saved;
    }

    public List<Checkin> getClientCheckins(Long clientId) {
        return checkinRepository.findAllByClientIdOrderByCheckinTimeDesc(clientId);
    }
}
