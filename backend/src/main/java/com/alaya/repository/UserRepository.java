package com.alaya.repository;

import com.alaya.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findAllByCoachId(Long coachId);
    List<User> findAllByRole(com.alaya.model.Role role);
    long countByRole(com.alaya.model.Role role);
}
