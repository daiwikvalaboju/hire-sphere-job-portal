package com.jobportal.controller;

import com.jobportal.entity.Resume;
import com.jobportal.entity.User;
import com.jobportal.repository.UserRepository;
import com.jobportal.service.ResumeService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/resume")
public class ResumeController {

    private final ResumeService resumeService;
    private final UserRepository userRepository;

    public ResumeController(ResumeService resumeService, UserRepository userRepository) {
        this.resumeService = resumeService;
        this.userRepository = userRepository;
    }

    @GetMapping("/test")
    public ResponseEntity<?> testEndpoint() {
        return ResponseEntity.ok(Map.of(
            "status", "ok",
            "message", "Resume controller is working",
            "timestamp", System.currentTimeMillis()
        ));
    }

    @PostMapping("/upload")
    public ResponseEntity<?> uploadResume(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            Resume resume = resumeService.uploadResume(user, file);
            return ResponseEntity.ok(resume);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/upload-photo")
    public ResponseEntity<?> uploadProfilePhoto(
            @RequestParam("file") MultipartFile file,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            String photoUrl = resumeService.uploadProfilePhoto(user, file);
            user.setProfilePhotoUrl(photoUrl);
            userRepository.save(user);

            return ResponseEntity.ok(new ProfilePhotoResponse(photoUrl));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @GetMapping("/my-resume")
    public ResponseEntity<?> getMyResume(Authentication authentication) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            return ResponseEntity.ok(resumeService.getResumeData(user));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveProfile(
            @RequestBody ProfileData profileData,
            Authentication authentication
    ) {
        try {
            String email = authentication.getName();
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found"));

            user.setName(profileData.name);
            user.setPhone(profileData.phone);
            user.setLocation(profileData.location);
            user.setExperience(profileData.experience);
            user.setBio(profileData.summary);
            user.setSkills(profileData.skills);
            user.setEducation(profileData.education);
            user.setIndustry(profileData.industry);
            user.setWebsite(profileData.website);
            user.setCompanySize(profileData.companySize);
            user.setContactName(profileData.contactName);

            userRepository.save(user);
            
            return ResponseEntity.ok(Map.of("success", true, "message", "Profile saved successfully"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    static class ErrorResponse {
        public String message;
        public ErrorResponse(String message) { this.message = message; }
    }

    static class ProfilePhotoResponse {
        public String profilePhotoUrl;
        public ProfilePhotoResponse(String url) { this.profilePhotoUrl = url; }
    }

    static class ProfileData {
        public String name;
        public String phone;
        public String location;
        public String experience;
        public String summary;
        public String skills;
        public String education;
        public String industry;
        public String website;
        public String companySize;
        public String contactName;
    }
}
