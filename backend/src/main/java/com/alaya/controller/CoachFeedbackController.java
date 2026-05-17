package com.alaya.controller;

import com.alaya.model.CoachFeedback;
import com.alaya.model.User;
import com.alaya.service.CoachFeedbackService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class CoachFeedbackController {

    private final CoachFeedbackService coachFeedbackService;

    @Data
    public static class FeedbackRequest {
        private Long checkinId;
        private String feedbackText;
    }

    @PostMapping
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<CoachFeedback> addFeedback(@RequestBody FeedbackRequest req,
                                                   @AuthenticationPrincipal User coach) {
        return ResponseEntity.ok(coachFeedbackService.addFeedback(req.getCheckinId(), coach.getId(), req.getFeedbackText()));
    }

    @GetMapping("/checkin/{checkinId}")
    public ResponseEntity<List<CoachFeedback>> getFeedbackByCheckin(@PathVariable Long checkinId) {
        return ResponseEntity.ok(coachFeedbackService.getFeedbackForCheckin(checkinId));
    }
}
