package com.alaya.service;

import com.alaya.dto.*;
import com.alaya.model.*;
import com.alaya.repository.UserRepository;
import com.alaya.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authManager;
    private final NotificationService notificationService;
    private final OtpService otpService;
    private final EmailService emailService;

    public void requestSignupOtp(OtpRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        String otp = otpService.generateOtp();
        otpService.saveOtp(req.getEmail(), otp, OtpToken.TokenType.SIGNUP);
        emailService.sendOtpEmail(req.getEmail(), otp);
    }

    public void verifySignupOtp(OtpVerifyRequest req) {
        boolean verified = otpService.verifyOtp(req.getEmail(), req.getOtp(), OtpToken.TokenType.SIGNUP, false);
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
    }

    public AuthResponse register(AuthRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        if (req.getPassword() == null || !req.getPassword().equals(req.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match");
        }

        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required for registration");
        }
        
        Long coachId = req.getCoachId();
        Role role = Role.CLIENT;
        try {
            if (req.getRole() != null) role = Role.valueOf(req.getRole().toUpperCase());
        } catch (Exception ignored) {}

        if (role == Role.CLIENT && coachId == null) {
            coachId = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.COACH)
                    .map(User::getId)
                    .findFirst()
                    .orElse(null);
        }

        User.UserBuilder builder = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(role)
                .coachId(coachId)
                .emailVerified(true);

        // Map Profile Data
        if (req.getGender() != null) {
            try {
                builder.gender(Gender.valueOf(req.getGender().toUpperCase()));
            } catch (Exception ignored) {}
        }
        builder.birthDate(req.getBirthDate());
        builder.currentWeight(req.getCurrentWeight());
        builder.targetWeight(req.getTargetWeight());
        builder.heightCm(req.getHeightCm());
        if (req.getActivityLevel() != null) {
            try {
                builder.activityLevel(ActivityLevel.valueOf(req.getActivityLevel().toUpperCase()));
            } catch (Exception ignored) {}
        }
        builder.primaryGoal(req.getPrimaryGoal());

        User saved = userRepository.save(builder.build());

        // ... (rest of the notifications)
        notificationService.createNotification(
                saved.getId(),
                "Welcome to Alaya!",
                "Your journey to a healthier life starts here. We've assigned you a coach to help you reach your goals.",
                Notification.NotificationType.SYSTEM,
                null
        );

        if (saved.getRole() == Role.CLIENT && saved.getCoachId() != null) {
            notificationService.createNotification(
                    saved.getCoachId(),
                    "New Client Assigned",
                    "A new client, " + saved.getFullName() + ", has been assigned to you.",
                    Notification.NotificationType.NEW_CLIENT,
                    String.valueOf(saved.getId())
            );
        }

        String token = jwtUtils.generateToken(saved);
        return new AuthResponse(token, new AuthResponse.UserResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getRole().name()));
    }

    public AuthResponse login(AuthRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Username not found. Please register first."));
        
        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Please verify your email first.");
        }

        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        
        String token = jwtUtils.generateToken(user);
        return new AuthResponse(token, new AuthResponse.UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name()));
    }

    public void requestForgotPasswordOtp(OtpRequest req) {
        if (!userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email not found");
        }
        String otp = otpService.generateOtp();
        otpService.saveOtp(req.getEmail(), otp, OtpToken.TokenType.FORGOT_PASSWORD);
        emailService.sendPasswordResetOtpEmail(req.getEmail(), otp);
    }

    public void verifyForgotPasswordOtp(OtpVerifyRequest req) {
        boolean verified = otpService.verifyOtp(req.getEmail(), req.getOtp(), OtpToken.TokenType.FORGOT_PASSWORD, false);
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
    }

    public void resetPassword(ResetPasswordRequest req) {
        boolean verified = otpService.verifyOtp(req.getEmail(), req.getOtp(), OtpToken.TokenType.FORGOT_PASSWORD);
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(user);
    }
}
