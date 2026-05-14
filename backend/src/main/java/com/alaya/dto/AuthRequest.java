package com.alaya.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AuthRequest {
    @Email @NotBlank public String email;
    @NotBlank       public String password;
    
    @JsonProperty("name")
    public String fullName;

    public String role; // "COACH" or "CLIENT"
    public Long coachId; // required if role = CLIENT
}
