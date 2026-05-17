package com.alaya.service;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    private final String uploadDir = "uploads/food";

    public FileStorageService() {
        try {
            Files.createDirectories(Paths.get(uploadDir));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }

    public String storeFile(MultipartFile file) {
        try {
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path targetLocation = Paths.get(uploadDir).resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }

    public Path getFilePath(String fileName) {
        return Paths.get(uploadDir).resolve(fileName);
    }
}
