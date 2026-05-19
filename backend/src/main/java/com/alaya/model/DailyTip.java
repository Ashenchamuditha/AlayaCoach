package com.alaya.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "daily_tips")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DailyTip {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long userId;

    @Column(columnDefinition = "TEXT")
    private String content;

    private LocalDate date;
}
