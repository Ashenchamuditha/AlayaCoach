package com.alaya.service;

import com.alaya.model.Goal;
import com.alaya.model.User;
import com.alaya.repository.GoalRepository;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskReminderScheduler {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // Run every minute (60,000 milliseconds)
    @Scheduled(fixedRate = 60000)
    public void checkAndSendReminders() {
        log.info("ALAYA SYSTEM - Running scheduled task check for active goals");
        List<Goal> activeGoals = goalRepository.findAllByStatusAndDeletedByClientFalse(Goal.GoalStatus.ACTIVE);
        LocalDateTime now = LocalDateTime.now();

        for (Goal goal : activeGoals) {
            try {
                // Determine target end time:
                LocalDateTime targetEndTime = null;
                if (goal.getDueDate() != null) {
                    targetEndTime = goal.getDueDate();
                } else if (goal.getDurationMinutes() != null) {
                    targetEndTime = goal.getCreatedAt().plusMinutes(goal.getDurationMinutes());
                }

                if (targetEndTime == null) {
                    continue; // No duration or due date set, cannot calculate reminder times
                }

                User client = userRepository.findById(goal.getClientId()).orElse(null);
                if (client == null) {
                    continue;
                }

                // Check for expiration
                if (now.isAfter(targetEndTime) || now.isEqual(targetEndTime)) {
                    if (!goal.isExpiredReminderSent()) {
                        log.info("Task '{}' has expired. Sending expiration email to {}", goal.getTitle(), client.getEmail());
                        emailService.sendTaskExpiredEmail(client.getEmail(), client.getFullName(), goal.getTitle(), goal.getId());
                        goal.setExpiredReminderSent(true);
                        goalRepository.save(goal);
                    }
                    continue; // Skip reminder if already expired
                }

                // Check for nearing deadline reminder
                long totalDurationMinutes;
                if (goal.getDurationMinutes() != null) {
                    totalDurationMinutes = goal.getDurationMinutes();
                } else {
                    totalDurationMinutes = Duration.between(goal.getCreatedAt(), targetEndTime).toMinutes();
                }

                // Nearing expiration rules
                if (!goal.isNearingReminderSent()) {
                    if (totalDurationMinutes <= 60) {
                        // Short task (<= 60 mins): remind when 15 minutes remain
                        LocalDateTime reminderTime = targetEndTime.minusMinutes(15);
                        if (now.isAfter(reminderTime) || now.isEqual(reminderTime)) {
                            log.info("Task '{}' is ending in 15 mins. Sending reminder email to {}", goal.getTitle(), client.getEmail());
                            emailService.sendTaskReminderEmail(client.getEmail(), client.getFullName(), goal.getTitle(), "15 minutes");
                            goal.setNearingReminderSent(true);
                            goalRepository.save(goal);
                        }
                    } else if (totalDurationMinutes <= 1440) {
                        // Medium task (<= 24 hours): remind when 2 hours remain
                        LocalDateTime reminderTime = targetEndTime.minusHours(2);
                        if (now.isAfter(reminderTime) || now.isEqual(reminderTime)) {
                            log.info("Task '{}' is ending in 2 hours. Sending reminder email to {}", goal.getTitle(), client.getEmail());
                            emailService.sendTaskReminderEmail(client.getEmail(), client.getFullName(), goal.getTitle(), "2 hours");
                            goal.setNearingReminderSent(true);
                            goalRepository.save(goal);
                        }
                    } else {
                        // Long task (> 24 hours): remind when 24 hours remain
                        LocalDateTime reminderTime = targetEndTime.minusDays(1);
                        if (now.isAfter(reminderTime) || now.isEqual(reminderTime)) {
                            log.info("Task '{}' is ending in 24 hours. Sending reminder email to {}", goal.getTitle(), client.getEmail());
                            emailService.sendTaskReminderEmail(client.getEmail(), client.getFullName(), goal.getTitle(), "24 hours");
                            goal.setNearingReminderSent(true);
                            goalRepository.save(goal);
                        }
                    }
                }
            } catch (Exception e) {
                log.error("Error checking reminders for Goal ID {}: {}", goal.getId(), e.getMessage());
            }
        }
    }
}
