package com.alaya.repository;

import com.alaya.model.FoodEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodEntryRepository extends JpaRepository<FoodEntry, Long> {
    List<FoodEntry> findAllByClientIdOrderByEntryTimeDesc(Long clientId);
}
