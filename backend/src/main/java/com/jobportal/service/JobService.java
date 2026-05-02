package com.jobportal.service;

import com.jobportal.dto.JobRequest;
import com.jobportal.dto.JobResponse;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.enums.JobStatus;
import com.jobportal.enums.JobType;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class JobService {

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private UserRepository userRepository;

    public Page<JobResponse> searchJobs(String keyword, String location, String jobType, 
                                       BigDecimal minSalary, BigDecimal maxSalary, String skills, Pageable pageable) {
        Page<Job> jobs;
        
        if (keyword != null && !keyword.trim().isEmpty()) {
            jobs = jobRepository.searchJobs(keyword, pageable);
        } else {
            JobType type = null;
            if (jobType != null && !jobType.trim().isEmpty()) {
                try {
                    type = JobType.valueOf(jobType.toUpperCase());
                } catch (IllegalArgumentException e) {
                    type = null;
                }
            }
            jobs = jobRepository.findJobsWithFilters(location, type, minSalary, maxSalary, skills, pageable);
        }
        
        return jobs.map(this::convertToJobResponse);
    }

    public JobResponse getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));
        return convertToJobResponse(job);
    }

    public JobResponse createJob(JobRequest request, String recruiterEmail) {
        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));

        Job job = new Job();
        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCompany(request.getCompany());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setMinSalary(request.getMinSalary());
        job.setMaxSalary(request.getMaxSalary());
        job.setRequirements(request.getRequirements());
        job.setBenefits(request.getBenefits());
        job.setSkills(request.getSkills());
        job.setExperience(request.getExperience());
        job.setEducation(request.getEducation());
        job.setApplicationDeadline(request.getApplicationDeadline());
        job.setRecruiter(recruiter);
        job.setStatus(JobStatus.APPROVED); // AUTO-APPROVE for testing (change to PENDING if you want admin approval)
        job.setCreatedAt(LocalDateTime.now());

        Job savedJob = jobRepository.save(job);
        return convertToJobResponse(savedJob);
    }

    public JobResponse updateJob(Long id, JobRequest request, String recruiterEmail) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));

        if (!job.getRecruiter().getUserId().equals(recruiter.getUserId())) {
            throw new RuntimeException("You can only update your own jobs");
        }

        job.setTitle(request.getTitle());
        job.setDescription(request.getDescription());
        job.setCompany(request.getCompany());
        job.setLocation(request.getLocation());
        job.setJobType(request.getJobType());
        job.setMinSalary(request.getMinSalary());
        job.setMaxSalary(request.getMaxSalary());
        job.setRequirements(request.getRequirements());
        job.setBenefits(request.getBenefits());
        job.setSkills(request.getSkills());
        job.setExperience(request.getExperience());
        job.setEducation(request.getEducation());
        job.setApplicationDeadline(request.getApplicationDeadline());
        Job savedJob = jobRepository.save(job);
        return convertToJobResponse(savedJob);
    }

    public void deleteJob(Long id, String recruiterEmail) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Job not found"));

        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));

        if (!job.getRecruiter().getUserId().equals(recruiter.getUserId())) {
            throw new RuntimeException("You can only delete your own jobs");
        }

        jobRepository.delete(job);
    }

    public Page<JobResponse> getJobsByRecruiter(String recruiterEmail, Pageable pageable) {
        User recruiter = userRepository.findByEmail(recruiterEmail)
                .orElseThrow(() -> new RuntimeException("Recruiter not found"));

        Page<Job> jobs = jobRepository.findByRecruiterUserId(recruiter.getUserId(), pageable);
        return jobs.map(this::convertToJobResponse);
    }

    private JobResponse convertToJobResponse(Job job) {
        JobResponse response = new JobResponse();
        response.setJobId(job.getJobId());
        response.setTitle(job.getTitle());
        response.setDescription(job.getDescription());
        response.setCompany(job.getCompany());
        response.setLocation(job.getLocation());
        response.setJobType(job.getJobType());
        response.setMinSalary(job.getMinSalary());
        response.setMaxSalary(job.getMaxSalary());
        response.setRequirements(job.getRequirements());
        response.setBenefits(job.getBenefits());
        response.setSkills(job.getSkills());
        response.setExperience(job.getExperience());
        response.setEducation(job.getEducation());
        response.setApplicationDeadline(job.getApplicationDeadline());
        response.setStatus(job.getStatus());
        response.setCreatedAt(job.getCreatedAt());
        if (job.getRecruiter() != null) {
            response.setRecruiterName(job.getRecruiter().getName());
            response.setRecruiterEmail(job.getRecruiter().getEmail());
        }
        return response;
    }
}