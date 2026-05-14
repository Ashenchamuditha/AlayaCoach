package com.alaya.service;

import com.alaya.dto.AuthRequest;
import com.alaya.dto.AuthResponse;
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

    public AuthResponse register(AuthRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }
        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new IllegalArgumentException("Full name is required for registration");
        }
        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .fullName(req.getFullName())
                .role(Role.valueOf(req.getRole().toUpperCase()))
                .coachId(req.getCoachId())
                .build();
        userRepository.save(user);
        String token = jwtUtils.generateToken(user);
        return new AuthResponse(token, new AuthResponse.UserResponse(user.getId(), user.getFullName(), user.getEmail(), user.getRole().name()));
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
