package com.alaya.controller;

import com.alaya.dto.*;
import com.alaya.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/request-otp")
    public ResponseEntity<?> requestOtp(@RequestBody OtpRequest req) {
        authService.requestSignupOtp(req);
        return ResponseEntity.ok(Map.of("message", "OTP sent to " + req.getEmail()));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerifyRequest req) {
        authService.verifySignupOtp(req);
        return ResponseEntity.ok(Map.of("message", "Email verified successfully"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody OtpRequest req) {
        authService.requestForgotPasswordOtp(req);
        return ResponseEntity.ok(Map.of("message", "Password reset code sent to " + req.getEmail()));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }
}
