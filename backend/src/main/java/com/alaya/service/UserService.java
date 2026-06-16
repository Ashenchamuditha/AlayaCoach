package com.alaya.service;

import com.alaya.dto.ProfileUpdateDTO;
import com.alaya.dto.UserProfileDTO;
import com.alaya.model.*;
import com.alaya.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserProfileDTO getProfile(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        
        return UserProfileDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .gender(user.getGender())
                .birthDate(user.getBirthDate())
                .currentWeight(user.getCurrentWeight())
                .targetWeight(user.getTargetWeight())
                .heightCm(user.getHeightCm())
                .activityLevel(user.getActivityLevel())
                .primaryGoal(user.getPrimaryGoal())
                .build();
    }

    @Transactional
    public UserProfileDTO updateProfile(String email, ProfileUpdateDTO req) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Basic Info
        if (req.getFullName() != null && !req.getFullName().isBlank()) {
            user.setFullName(req.getFullName());
        }

        // Biometrics (only for CLIENT)
        if (user.getRole() == Role.CLIENT) {
            if (req.getGender() != null) {
                try {
                    user.setGender(Gender.valueOf(req.getGender().toUpperCase()));
                } catch (Exception ignored) {}
            }
            if (req.getBirthDate() != null) user.setBirthDate(req.getBirthDate());
            if (req.getCurrentWeight() != null) user.setCurrentWeight(req.getCurrentWeight());
            if (req.getTargetWeight() != null) user.setTargetWeight(req.getTargetWeight());
            if (req.getHeightCm() != null) user.setHeightCm(req.getHeightCm());
            if (req.getActivityLevel() != null) {
                try {
                    user.setActivityLevel(ActivityLevel.valueOf(req.getActivityLevel().toUpperCase()));
                } catch (Exception ignored) {}
            }
            if (req.getPrimaryGoal() != null) user.setPrimaryGoal(req.getPrimaryGoal());
        }

        // Password Update
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            if (!req.getNewPassword().equals(req.getConfirmPassword())) {
                throw new IllegalArgumentException("Passwords do not match");
            }
            if (req.getNewPassword().length() < 6) {
                throw new IllegalArgumentException("Password must be at least 6 characters");
            }
            user.setPassword(passwordEncoder.encode(req.getNewPassword()));
        }

        User saved = userRepository.save(user);
        return getProfile(saved.getEmail());
    }
}
