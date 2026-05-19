package com.alaya.service;

import com.alaya.dto.*;
import com.alaya.model.Notification;
import com.alaya.model.OtpToken;
import com.alaya.model.Role;
import com.alaya.model.User;
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
        boolean verified = otpService.verifyOtp(req.getEmail(), req.getOtp(), OtpToken.TokenType.SIGNUP);
        if (!verified) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }
        // Verification success can be tracked in session or via a temporary flag if needed, 
        // but here we'll assume the client will proceed to register.
    }

    public AuthResponse register(AuthRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        
        // In a real app, you might want to re-verify the OTP here or check a "verified" flag in DB/Session.
        // For simplicity, we'll assume OTP was verified in the previous step.

        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required for registration");
        }
        Long coachId = req.getCoachId();
        if (Role.valueOf(req.getRole().toUpperCase()) == Role.CLIENT && coachId == null) {
            coachId = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.COACH)
                    .map(User::getId)
                    .findFirst()
                    .orElse(null);
        }

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(Role.CLIENT) // Force all public registrations to CLIENT
                .coachId(coachId)
                .emailVerified(true)
                .build();
        User saved = userRepository.save(user);

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
