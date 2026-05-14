package com.alaya.repository;

import com.alaya.model.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findAllByClientId(Long clientId);
    List<Goal> findAllByCoachId(Long coachId);
    long countByStatus(Goal.GoalStatus status);
}
