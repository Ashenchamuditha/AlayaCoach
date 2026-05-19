package com.alaya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AuthRequest {
    @Email @NotBlank public String email;
    @NotBlank       public String password;
    public String confirmPassword;
    
    @JsonProperty("name")
    public String fullName;

    public String role; // "COACH" or "CLIENT"
    public Long coachId; // required if role = CLIENT

    // Profile Data
    public String gender;
    public LocalDate birthDate;
    public Double currentWeight;
    public Double targetWeight;
    public Double heightCm;
    public String activityLevel;
    public String primaryGoal;
}
