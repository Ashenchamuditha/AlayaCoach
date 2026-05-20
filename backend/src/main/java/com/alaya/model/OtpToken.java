package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "otp_tokens")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private String otp;

    @Column(nullable = false)
    private LocalDateTime expiryTime;

    @Column(nullable = false)
    private TokenType type; // SIGNUP, FORGOT_PASSWORD

    public enum TokenType {
        SIGNUP, FORGOT_PASSWORD
    }

    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiryTime);
    }
}
