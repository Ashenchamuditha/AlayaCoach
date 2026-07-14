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

    private final String baseUploadDir = "uploads";

    public FileStorageService() {
        try {
            Files.createDirectories(Paths.get(baseUploadDir).resolve("food"));
            Files.createDirectories(Paths.get(baseUploadDir).resolve("chat"));
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directories", e);
        }
    }

    public String storeFile(MultipartFile file) {
        return storeFile(file, "food");
    }

    public String storeFile(MultipartFile file, String subDir) {
        try {
            String dir = baseUploadDir + "/" + subDir;
            Files.createDirectories(Paths.get(dir));
            String fileName = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
            Path targetLocation = Paths.get(dir).resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation);
            return fileName;
        } catch (IOException e) {
            throw new RuntimeException("Could not store file", e);
        }
    }


    public Path getFilePath(String fileName) {
        return getFilePath(fileName, "food");
    }

    public Path getFilePath(String fileName, String subDir) {
        return Paths.get(baseUploadDir).resolve(subDir).resolve(fileName);
    }
}
