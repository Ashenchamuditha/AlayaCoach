package com.alaya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthRequest {
    @Email 
    @NotBlank 
    private String email;

    @NotBlank 
    private String password;

    private String confirmPassword;
    
    @JsonProperty("name")
    private String fullName;

    private String role; // "COACH" or "CLIENT"
    private Long coachId; // required if role = CLIENT

    // Profile Data
    private String gender;
    private java.time.LocalDate birthDate;
    private Double currentWeight;
    private Double targetWeight;
    private Double heightCm;
    private String activityLevel;
    private String primaryGoal;
}
