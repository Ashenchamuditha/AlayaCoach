package com.alaya.controller;

import com.alaya.model.FoodEntry;
import com.alaya.model.User;
import com.alaya.service.FoodEntryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/food")
@RequiredArgsConstructor
public class FoodEntryController {

    private final FoodEntryService foodEntryService;

    @Data
    public static class FoodEntryRequest {
        private String foodName;
        private String portion;
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
        private LocalDateTime entryTime;
    }

    @Data
    public static class CoachFeedbackRequest {
        private String feedback;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<FoodEntry> logFood(@RequestBody FoodEntryRequest req,
                                             @AuthenticationPrincipal User client) {
        return ResponseEntity.ok(foodEntryService.logFoodEntry(
                client.getId(), req.getFoodName(), req.getPortion(), req.getEntryTime()));
    }

    @PostMapping("/upload")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<FoodEntry> logFoodWithImage(@RequestParam("file") MultipartFile file,
                                                      @RequestParam(value = "foodName", required = false) String foodName,
                                                      @RequestParam(value = "portion", required = false) String portion,
                                                      @RequestParam(value = "entryTime", required = false) 
                                                      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime entryTime,
                                                      @AuthenticationPrincipal User client) {
        return ResponseEntity.ok(foodEntryService.logFoodWithImage(client.getId(), file, foodName, portion, entryTime));
    }

    @GetMapping
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<List<FoodEntry>> myFoodEntries(@AuthenticationPrincipal User client) {
        return ResponseEntity.ok(foodEntryService.getClientFoodEntries(client.getId()));
    }

    @GetMapping("/client/{clientId}")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<List<FoodEntry>> clientFoodEntries(@PathVariable Long clientId) {
        return ResponseEntity.ok(foodEntryService.getClientFoodEntries(clientId));
    }

    @PostMapping("/{id}/feedback")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<FoodEntry> addCoachFeedback(@PathVariable Long id,
                                                      @RequestBody CoachFeedbackRequest req) {
        return ResponseEntity.ok(foodEntryService.addCoachFeedback(id, req.getFeedback()));
    }

    @DeleteMapping("/{id}/feedback")
    @PreAuthorize("hasRole('COACH')")
    public ResponseEntity<FoodEntry> deleteCoachFeedback(@PathVariable Long id) {
        return ResponseEntity.ok(foodEntryService.deleteCoachFeedback(id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT', 'COACH')")
    public ResponseEntity<Void> deleteFoodEntry(@PathVariable Long id,
                                               @AuthenticationPrincipal User user) {
        foodEntryService.deleteFoodEntry(id, user.getId(), user.getRole());
        return ResponseEntity.noContent().build();
    }
}
