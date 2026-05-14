package com.alaya.repository;

import com.alaya.model.CoachFeedback;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CoachFeedbackRepository extends JpaRepository<CoachFeedback, Long> {
    List<CoachFeedback> findAllByCheckinId(Long checkinId);
}
