package com.alaya.controller;

import com.alaya.model.Checkin;
import com.alaya.model.User;
import com.alaya.service.CheckinService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkins")
@RequiredArgsConstructor
public class CheckinController {

    private final CheckinService checkinService;

    @Data
    public static class CheckinRequest {
        Long goalId;
        String note;
        boolean completed;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<Checkin> logCheckin(@RequestBody CheckinRequest req,
                                              @AuthenticationPrincipal User client) {
        String note = (req.getNote() != null) ? req.getNote() : "Goal progress check-in";
        Checkin checkin = checkinService.logCheckin(client.getId(), req.getGoalId(), note, req.isCompleted());
        return ResponseEntity.ok(checkin);
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<Checkin>> myCheckins(@AuthenticationPrincipal User client) {
        return ResponseEntity.ok(checkinService.getClientCheckins(client.getId()));
    }
}
