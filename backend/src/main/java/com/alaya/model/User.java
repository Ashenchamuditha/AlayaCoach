package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.time.LocalDate;

@Entity
@Table(name = "users", indexes = {
    @Index(name = "idx_user_email", columnList = "email", unique = true),
    @Index(name = "idx_user_coach_id", columnList = "coachId")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, name = "password_hash")
    private String password;

    @Column(nullable = false)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    // For CLIENT: references their assigned COACH's id. Null for COACHes.
    private Long coachId;

    @Builder.Default
    private boolean emailVerified = false;

    // Biometrics and Profile
    @Enumerated(EnumType.STRING)
    private Gender gender;

    private LocalDate birthDate;
    private Double currentWeight;
    private Double targetWeight;
    private Double heightCm;

    @Enumerated(EnumType.STRING)
    private ActivityLevel activityLevel;

    private String primaryGoal; // e.g., "Weight Loss", "Muscle Gain", "Maintenance"

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override public String getUsername() { return email; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isEnabled() { return true; }
}
