package com.alaya.service;

import com.alaya.dto.AuthRequest;
import com.alaya.dto.AuthResponse;
import com.alaya.model.Notification;
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

    public AuthResponse register(AuthRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
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
                .role(Role.valueOf(req.getRole().toUpperCase()))
                .coachId(coachId)
                .build();
        User saved = userRepository.save(user);

        // System notification for successful signup
        notificationService.createNotification(
                saved.getId(),
                "Welcome to Alaya!",
                "Your journey to a healthier life starts here. We've assigned you a coach to help you reach your goals.",
                Notification.NotificationType.SYSTEM,
                null
        );

        // Notify coach about new client
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
        if (!userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Username not found. Please register first.");
        }
        
        authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword()));
        
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String token = jwtUtils.generateToken(user);
        return new AuthResponse(token, new AuthResponse.UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name()));
    }
}
