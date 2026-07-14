package com.alaya.dto;

import com.alaya.model.ActivityLevel;
import com.alaya.model.Gender;
import com.alaya.model.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String email;
    private String fullName;
    private Role role;
    private Gender gender;
    private LocalDate birthDate;
    private Double currentWeight;
    private Double targetWeight;
    private Double heightCm;
    private ActivityLevel activityLevel;
    private String primaryGoal;
    private String profilePictureUrl;
}
