package com.alaya.repository;

import com.alaya.model.Checkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface CheckinRepository extends JpaRepository<Checkin, Long> {
    List<Checkin> findAllByClientIdOrderByCheckinTimeDesc(Long clientId);
    List<Checkin> findTop5ByClientIdOrderByCheckinTimeDesc(Long clientId);
    Optional<Checkin> findFirstByGoalIdAndCheckinTimeBetween(Long goalId, LocalDateTime start, LocalDateTime end);
    Optional<Checkin> findByGoalIdAndDate(Long goalId, LocalDate date);
    Optional<Checkin> findFirstByGoalIdOrderByCheckinTimeDesc(Long goalId);
}
