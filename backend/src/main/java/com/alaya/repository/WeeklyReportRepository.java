package com.alaya.repository;

import com.alaya.model.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Long> {
    Optional<WeeklyReport> findTopByClientIdOrderByEndDateDesc(Long clientId);
}
