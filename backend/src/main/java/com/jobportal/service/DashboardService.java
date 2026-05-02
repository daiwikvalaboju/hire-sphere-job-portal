package com.jobportal.service;

import com.jobportal.dto.DashboardStats;
import com.jobportal.enums.ApplicationStatus;
import com.jobportal.enums.JobStatus;
import com.jobportal.enums.UserRole;
import com.jobportal.repository.ApplicationRepository;
import com.jobportal.repository.JobRepository;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Service
public class DashboardService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JobRepository jobRepository;

    @Autowired
    private ApplicationRepository applicationRepository;

    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();
        
        // User counts
        stats.setTotalUsers(userRepository.count());
        stats.setTotalCandidates(userRepository.countActiveUsersByRole(UserRole.CANDIDATE));
        stats.setTotalRecruiters(userRepository.countActiveUsersByRole(UserRole.RECRUITER));
        
        // Job counts
        stats.setTotalJobs(jobRepository.count());
        stats.setActiveJobs(jobRepository.countByStatus(JobStatus.APPROVED));
        stats.setPendingJobs(jobRepository.countByStatus(JobStatus.PENDING));
        
        // Application counts
        stats.setTotalApplications(applicationRepository.count());
        stats.setPendingApplications(applicationRepository.findByStatus(ApplicationStatus.PENDING).size());
        
        return stats;
    }

    public Map<String, Object> getUserGrowthData() {
        Map<String, Object> data = new HashMap<>();
        // Implementation for user growth analytics
        // This would typically involve more complex queries
        data.put("labels", new String[]{"Jan", "Feb", "Mar", "Apr", "May", "Jun"});
        data.put("candidates", new int[]{10, 25, 35, 50, 75, 100});
        data.put("recruiters", new int[]{2, 5, 8, 12, 18, 25});
        return data;
    }

    public Map<String, Object> getJobTrendsData() {
        Map<String, Object> data = new HashMap<>();
        data.put("labels", new String[]{"Full Time", "Part Time", "Contract", "Internship", "Remote"});
        data.put("values", new int[]{45, 15, 20, 10, 35});
        return data;
    }

    public Map<String, Object> getApplicationStatsData() {
        Map<String, Object> data = new HashMap<>();
        data.put("pending", applicationRepository.findByStatus(ApplicationStatus.PENDING).size());
        data.put("reviewed", applicationRepository.findByStatus(ApplicationStatus.REVIEWED).size());
        data.put("accepted", applicationRepository.findByStatus(ApplicationStatus.ACCEPTED).size());
        data.put("rejected", applicationRepository.findByStatus(ApplicationStatus.REJECTED).size());
        return data;
    }
}