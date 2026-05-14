package com.alaya.repository;

import com.alaya.model.Checkin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CheckinRepository extends JpaRepository<Checkin, Long> {
    List<Checkin> findAllByClientIdOrderByCheckinTimeDesc(Long clientId);
    List<Checkin> findTop5ByClientIdOrderByCheckinTimeDesc(Long clientId);
}
