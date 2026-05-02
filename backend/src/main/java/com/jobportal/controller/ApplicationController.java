package com.jobportal.controller;

import com.jobportal.dto.ApplicationResponse;
import com.jobportal.entity.Application;
import com.jobportal.enums.ApplicationStatus;
import com.jobportal.service.ApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
@CrossOrigin(origins = "*")
public class ApplicationController {

    @Autowired
    private ApplicationService applicationService;

    @PostMapping("/apply")
    public ResponseEntity<?> applyForJob(
            @RequestParam Long jobId,
            @RequestParam(required = false) String coverLetter,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Application application = applicationService.applyForJob(jobId, userEmail, coverLetter);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Application submitted successfully");
            response.put("applicationId", application.getApplicationId());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my-applications")
    public ResponseEntity<?> getMyApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Page<Application> applications = applicationService.getMyApplications(
                    userEmail, PageRequest.of(page, size));
            
            Page<ApplicationResponse> response = applications.map(app -> {
                ApplicationResponse dto = new ApplicationResponse();
                dto.setApplicationId(app.getApplicationId());
                dto.setStatus(app.getStatus());
                dto.setCoverLetter(app.getCoverLetter());
                dto.setAppliedAt(app.getAppliedAt());
                dto.setRecruiterNotes(app.getRecruiterNotes());
                dto.setAiMatchScore(app.getAiMatchScore());
                
                if (app.getJob() != null) {
                    dto.setJobId(app.getJob().getJobId());
                    dto.setJobTitle(app.getJob().getTitle());
                    dto.setCompany(app.getJob().getCompany());
                    dto.setJobLocation(app.getJob().getLocation());
                }
                
                if (app.getUser() != null) {
                    dto.setCandidateId(app.getUser().getUserId());
                    dto.setCandidateName(app.getUser().getName());
                    dto.setCandidateEmail(app.getUser().getEmail());
                }
                
                if (app.getResume() != null) {
                    dto.setResumeId(app.getResume().getResumeId());
                    dto.setResumeFileName(app.getResume().getFileName());
                }
                
                return dto;
            });
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getApplicationById(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Application application = applicationService.getApplicationById(id, userEmail);
            return ResponseEntity.ok(application);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawApplication(
            @PathVariable Long id,
            Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Application application = applicationService.withdrawApplication(id, userEmail);
            return ResponseEntity.ok(Map.of("message", "Application withdrawn successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getApplicationStats(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Map<String, Long> stats = new HashMap<>();
            stats.put("total", applicationService.countByUser(userEmail));
            stats.put("pending", applicationService.countByUserAndStatus(userEmail, ApplicationStatus.PENDING));
            stats.put("reviewed", applicationService.countByUserAndStatus(userEmail, ApplicationStatus.REVIEWED));
            stats.put("shortlisted", applicationService.countByUserAndStatus(userEmail, ApplicationStatus.SHORTLISTED));
            stats.put("accepted", applicationService.countByUserAndStatus(userEmail, ApplicationStatus.ACCEPTED));
            stats.put("rejected", applicationService.countByUserAndStatus(userEmail, ApplicationStatus.REJECTED));
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/recruiter/stats")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> getRecruiterStats(Authentication authentication) {
        try {
            String recruiterEmail = authentication.getName();
            long totalApplicants = applicationService.countApplicationsForRecruiter(recruiterEmail);
            return ResponseEntity.ok(Map.of("totalApplicants", totalApplicants));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/recruiter/applications")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> getRecruiterApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        try {
            String recruiterEmail = authentication.getName();
            Page<Application> applications = applicationService.getApplicationsForRecruiter(
                    recruiterEmail, PageRequest.of(page, size));
            
            Page<ApplicationResponse> response = applications.map(app -> {
                ApplicationResponse dto = new ApplicationResponse();
                dto.setApplicationId(app.getApplicationId());
                dto.setStatus(app.getStatus());
                dto.setCoverLetter(app.getCoverLetter());
                dto.setAppliedAt(app.getAppliedAt());
                
                if (app.getJob() != null) {
                    dto.setJobId(app.getJob().getJobId());
                    dto.setJobTitle(app.getJob().getTitle());
                    dto.setCompany(app.getJob().getCompany());
                }
                
                if (app.getUser() != null) {
                    dto.setCandidateId(app.getUser().getUserId());
                    dto.setCandidateName(app.getUser().getName());
                    dto.setCandidateEmail(app.getUser().getEmail());
                }
                
                return dto;
            });
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('RECRUITER')")
    public ResponseEntity<?> updateApplicationStatus(
            @PathVariable Long id,
            @RequestParam String status,
            Authentication authentication) {
        try {
            String recruiterEmail = authentication.getName();
            ApplicationStatus newStatus = ApplicationStatus.valueOf(status);
            applicationService.updateApplicationStatus(id, recruiterEmail, newStatus);
            return ResponseEntity.ok(Map.of("message", "Application status updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}