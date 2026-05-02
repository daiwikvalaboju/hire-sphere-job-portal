package com.jobportal.service;

import com.jobportal.entity.Application;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.enums.ApplicationStatus;
import com.jobportal.repository.ApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class ApplicationService {

    @Autowired
    private ApplicationRepository applicationRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    // ================= APPLY FOR JOB =================
    @Transactional
    public Application applyForJob(Long jobId, String userEmail, String coverLetter) throws Exception {

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new Exception("User not found"));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new Exception("Job not found"));

        if (applicationRepository.existsByUserAndJob(user, job)) {
            throw new Exception("You have already applied for this job");
        }

        Application application = new Application();
        application.setUser(user);
        application.setJob(job);
        application.setCoverLetter(coverLetter);
        application.setStatus(ApplicationStatus.PENDING);
        application.setAppliedAt(LocalDateTime.now());
        application.setUpdatedAt(LocalDateTime.now());

        Application savedApplication = applicationRepository.save(application);

        // 🔥 Send Email to Recruiter
        String recruiterEmail = job.getRecruiter().getEmail();

        emailService.sendApplicationNotification(
                recruiterEmail,
                job.getTitle(),
                user.getName(),
                user.getEmail()
        );

        return savedApplication;
    }

    // ================= GET MY APPLICATIONS =================
    public Page<Application> getMyApplications(String userEmail, Pageable pageable) throws Exception {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new Exception("User not found"));
        return applicationRepository.findByUserOrderByAppliedAtDesc(user, pageable);
    }

    // ================= GET APPLICATION BY ID =================
    public Application getApplicationById(Long applicationId, String userEmail) throws Exception {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new Exception("Application not found"));

        if (!application.getUser().getEmail().equals(userEmail)) {
            throw new Exception("Unauthorized access");
        }

        return application;
    }

    // ================= WITHDRAW APPLICATION =================
    @Transactional
    public Application withdrawApplication(Long applicationId, String userEmail) throws Exception {

        Application application = getApplicationById(applicationId, userEmail);

        if (application.getStatus() != ApplicationStatus.PENDING &&
                application.getStatus() != ApplicationStatus.REVIEWED) {
            throw new Exception("Cannot withdraw application in current status");
        }

        application.setStatus(ApplicationStatus.WITHDRAWN);
        application.setUpdatedAt(LocalDateTime.now());

        return applicationRepository.save(application);
    }

    // ================= UPDATE APPLICATION STATUS =================
    @Transactional
    public void updateApplicationStatus(Long applicationId,
                                        String recruiterEmail,
                                        ApplicationStatus newStatus) throws Exception {

        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new Exception("Application not found"));

        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new Exception("Recruiter not found"));

        if (!application.getJob().getRecruiter().getUserId().equals(recruiter.getUserId())) {
            throw new Exception("You can only update applications for your own jobs");
        }

        application.setStatus(newStatus);
        application.setUpdatedAt(LocalDateTime.now());
        applicationRepository.save(application);

        // Send Email to Candidate with company name
        String candidateEmail = application.getUser().getEmail();
        String candidateName = application.getUser().getName();
        String jobTitle = application.getJob().getTitle();
        String companyName = application.getJob().getCompany();

        emailService.sendApplicationStatusUpdate(
                candidateEmail,
                candidateName,
                jobTitle,
                companyName,
                newStatus.name()
        );
    }

    // ================= COUNT METHODS =================
    public long countByUserAndStatus(String userEmail, ApplicationStatus status) throws Exception {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new Exception("User not found"));
        return applicationRepository.countByUserAndStatus(user, status);
    }

    public long countByUser(String userEmail) throws Exception {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new Exception("User not found"));
        return applicationRepository.countByUser(user);
    }

    public long countApplicationsForRecruiter(String recruiterEmail) throws Exception {
        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new Exception("Recruiter not found"));

        return applicationRepository.countByJobRecruiterUserId(recruiter.getUserId());
    }

    public Page<Application> getApplicationsForRecruiter(String recruiterEmail, Pageable pageable) throws Exception {
        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new Exception("Recruiter not found"));

        return applicationRepository.findByJobRecruiterUserId(recruiter.getUserId(), pageable);
    }
}