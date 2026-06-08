package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_reports")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long clientId;

    private LocalDate startDate;
    private LocalDate endDate;

    @Column(columnDefinition = "TEXT")
    private String clientSummary;

    @Column(columnDefinition = "TEXT")
    private String coachBrief;

    private LocalDateTime createdAt;
}
