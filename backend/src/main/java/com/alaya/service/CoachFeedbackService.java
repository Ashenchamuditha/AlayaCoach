package com.alaya.service;

import com.alaya.model.CoachFeedback;
import com.alaya.repository.CoachFeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CoachFeedbackService {

    private final CoachFeedbackRepository coachFeedbackRepository;

    public CoachFeedback addFeedback(Long checkinId, Long coachId, String feedbackText) {
        CoachFeedback feedback = CoachFeedback.builder()
                .checkinId(checkinId)
                .coachId(coachId)
                .feedbackText(feedbackText)
                .build();
        return coachFeedbackRepository.save(feedback);
    }

    public List<CoachFeedback> getFeedbackForCheckin(Long checkinId) {
        return coachFeedbackRepository.findAllByCheckinId(checkinId);
    }
}
