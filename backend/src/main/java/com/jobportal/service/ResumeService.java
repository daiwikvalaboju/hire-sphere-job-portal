package com.jobportal.service;

import com.jobportal.entity.Resume;
import com.jobportal.entity.User;
import com.jobportal.repository.ResumeRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;

    private static final String RESUME_FOLDER = "resumes";
    private static final String PHOTOS_FOLDER = "photos";
    private static final long MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB
    private static final long MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2MB

    public ResumeService(ResumeRepository resumeRepository, UserRepository userRepository) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
    }

    private String getUploadBasePath() {
        String userDir = System.getProperty("user.dir");
        return userDir + File.separator + "uploads";
    }

    private void ensureDirectoryExists(String folderPath) throws IOException {
        Path path = Paths.get(folderPath);
        if (!Files.exists(path)) {
            Files.createDirectories(path);
        }
    }

    public Resume uploadResume(User user, MultipartFile file) {
        validateResumeFile(file);

        try {
            String basePath = getUploadBasePath();
            String resumePath = basePath + File.separator + RESUME_FOLDER;
            
            ensureDirectoryExists(resumePath);

            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String fileName = "resume_" + user.getUserId() + "_" + System.currentTimeMillis() + extension;
            String fullPath = resumePath + File.separator + fileName;
            String relativePath = "/uploads/" + RESUME_FOLDER + "/" + fileName;

            File destFile = new File(fullPath);
            file.transferTo(destFile);

            Optional<Resume> existingResume = resumeRepository.findByUserUserIdAndIsPrimaryTrue(user.getUserId());
            if (existingResume.isPresent()) {
                Resume oldResume = existingResume.get();
                try {
                    File oldFile = new File(oldResume.getFilePath().replace("/uploads/", getUploadBasePath() + File.separator));
                    if (oldFile.exists()) {
                        oldFile.delete();
                    }
                } catch (Exception e) {
                    // Ignore file deletion errors
                }
                oldResume.setIsPrimary(false);
                resumeRepository.save(oldResume);
            }

            Resume resume = new Resume();
            resume.setFileName(originalFilename);
            resume.setFilePath(relativePath);
            resume.setFileSize(file.getSize());
            resume.setFileType(file.getContentType());
            resume.setIsPrimary(true);
            resume.setUser(user);

            return resumeRepository.save(resume);

        } catch (IOException e) {
            throw new RuntimeException("Failed to create upload directory: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Resume upload failed: " + e.getMessage(), e);
        }
    }

    public String uploadProfilePhoto(User user, MultipartFile file) {
        validatePhotoFile(file);

        try {
            String basePath = getUploadBasePath();
            String photoPath = basePath + File.separator + PHOTOS_FOLDER;
            
            ensureDirectoryExists(photoPath);

            String originalFilename = file.getOriginalFilename();
            String extension = getFileExtension(originalFilename);
            String fileName = "photo_" + user.getUserId() + "_" + System.currentTimeMillis() + extension;
            String fullPath = photoPath + File.separator + fileName;
            String relativePath = "/uploads/" + PHOTOS_FOLDER + "/" + fileName;

            File destFile = new File(fullPath);
            file.transferTo(destFile);

            return relativePath;

        } catch (IOException e) {
            throw new RuntimeException("Failed to create upload directory: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new RuntimeException("Photo upload failed: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> getResumeData(User user) {
        Map<String, Object> data = new HashMap<>();
        
        data.put("name", user.getName());
        data.put("phone", user.getPhone());
        data.put("location", user.getLocation());
        data.put("experience", user.getExperience());
        data.put("title", user.getName());
        data.put("summary", user.getBio());
        data.put("skills", user.getSkills());
        data.put("education", user.getEducation());
        data.put("profilePhotoUrl", user.getProfilePhotoUrl());

        Optional<Resume> primaryResume = resumeRepository.findByUserUserIdAndIsPrimaryTrue(user.getUserId());
        if (primaryResume.isPresent()) {
            Resume resume = primaryResume.get();
            data.put("resumeUrl", resume.getFilePath());
            data.put("resumeFileName", resume.getFileName());
        }

        return data;
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.isEmpty()) {
            return "";
        }
        int lastDotIndex = filename.lastIndexOf(".");
        return lastDotIndex > 0 ? filename.substring(lastDotIndex) : "";
    }

    private void validateResumeFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a resume file to upload");
        }

        if (file.getSize() > MAX_RESUME_SIZE) {
            throw new IllegalArgumentException("Resume file size must be less than 5MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !(
            contentType.equals("application/pdf") ||
            contentType.equals("application/msword") ||
            contentType.equals("application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        )) {
            throw new IllegalArgumentException("Only PDF and Word documents (DOC/DOCX) are allowed");
        }
    }

    private void validatePhotoFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Please select a photo to upload");
        }

        if (file.getSize() > MAX_PHOTO_SIZE) {
            throw new IllegalArgumentException("Photo file size must be less than 2MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !(
            contentType.equals("image/jpeg") ||
            contentType.equals("image/jpg") ||
            contentType.equals("image/png")
        )) {
            throw new IllegalArgumentException("Only JPG and PNG images are allowed");
        }
    }
}
