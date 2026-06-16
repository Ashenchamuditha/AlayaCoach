package com.alaya.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data @NoArgsConstructor @AllArgsConstructor
public class ProfileUpdateDTO {
    private String fullName;
    private String gender;
    private LocalDate birthDate;
    private Double currentWeight;
    private Double targetWeight;
    private Double heightCm;
    private String activityLevel;
    private String primaryGoal;
    
    // Password update fields (optional)
    private String newPassword;
    private String confirmPassword;
}
