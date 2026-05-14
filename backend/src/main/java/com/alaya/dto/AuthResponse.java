package com.alaya.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String token;
    private UserResponse user;

    @Data @AllArgsConstructor @NoArgsConstructor
    public static class UserResponse {
        private Long id;
        private String name;
        private String email;
        private String role;
    }
}
