package com.jobportal.service;

import com.jobportal.dto.JobResponse;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.enums.JobStatus;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.ResumeRepository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AIMatchingService {

    private final JobRepository jobRepository;
    private final ResumeRepository resumeRepository;

    public AIMatchingService(JobRepository jobRepository,
                             ResumeRepository resumeRepository) {
        this.jobRepository = jobRepository;
        this.resumeRepository = resumeRepository;
    }

    public Page<JobResponse> getJobRecommendations(User candidate, Pageable pageable) {

        List<Job> jobs = jobRepository
                .findByStatus(JobStatus.APPROVED, Pageable.unpaged())
                .getContent();

        List<JobResponse> responses = jobs.stream().map(job -> {
            JobResponse r = new JobResponse();
            r.setJobId(job.getJobId());
            r.setTitle(job.getTitle());
            r.setCompany(job.getCompany()); // ✅ NOT getCompanyName()
            r.setLocation(job.getLocation());
            r.setSkills(job.getSkills());
            r.setExperience(job.getExperience());
            r.setCreatedAt(job.getCreatedAt());
            r.setStatus(job.getStatus());
            return r;
        }).toList();

        return new PageImpl<>(responses, pageable, responses.size());
    }
}
