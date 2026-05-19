package com.alaya.repository;

import com.alaya.model.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByEmailAndOtpAndType(String email, String otp, OtpToken.TokenType type);
    void deleteByEmailAndType(String email, OtpToken.TokenType type);
}
