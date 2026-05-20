package com.alaya.repository;

import com.alaya.model.DailyTip;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface DailyTipRepository extends JpaRepository<DailyTip, Long> {
    List<DailyTip> findAllByUserIdAndDate(Long userId, LocalDate date);
    void deleteAllByUserIdAndDate(Long userId, LocalDate date);
}
