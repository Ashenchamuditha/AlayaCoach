package com.alaya.controller;

import com.alaya.dto.ProfileUpdateDTO;
import com.alaya.dto.UserProfileDTO;
import com.alaya.service.UserService;
import com.alaya.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final FileStorageService fileStorageService;

    @GetMapping("/profile")
    public ResponseEntity<UserProfileDTO> getProfile(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(userService.getProfile(userDetails.getUsername()));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDTO> updateProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ProfileUpdateDTO req) {
        return ResponseEntity.ok(userService.updateProfile(userDetails.getUsername(), req));
    }

    @PostMapping("/profile/picture")
    public ResponseEntity<UserProfileDTO> uploadProfilePicture(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String fileName = fileStorageService.storeFile(file, "profile");
        String fileUrl = "/uploads/profile/" + fileName;
        UserProfileDTO updated = userService.updateProfilePicture(userDetails.getUsername(), fileUrl);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/profile/picture")
    public ResponseEntity<UserProfileDTO> deleteProfilePicture(
            @AuthenticationPrincipal UserDetails userDetails) {
        UserProfileDTO updated = userService.updateProfilePicture(userDetails.getUsername(), null);
        return ResponseEntity.ok(updated);
    }
}
