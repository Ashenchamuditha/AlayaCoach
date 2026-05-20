package com.alaya.service;

import com.alaya.model.OtpToken;
import com.alaya.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    public String generateOtp() {
        return String.format("%06d", secureRandom.nextInt(1000000));
    }

    @Transactional
    public void saveOtp(String email, String otp, OtpToken.TokenType type) {
        otpTokenRepository.deleteByEmailAndType(email, type);
        OtpToken token = OtpToken.builder()
                .email(email)
                .otp(otp)
                .expiryTime(LocalDateTime.now().plusMinutes(5))
                .type(type)
                .build();
        otpTokenRepository.save(token);
    }

    @Transactional
    public boolean verifyOtp(String email, String otp, OtpToken.TokenType type) {
        return otpTokenRepository.findByEmailAndOtpAndType(email, otp, type)
                .map(token -> {
                    if (token.isExpired()) {
                        otpTokenRepository.delete(token);
                        return false;
                    }
                    otpTokenRepository.delete(token);
                    return true;
                })
                .orElse(false);
    }
}
