package com.jobportal.dto;

public class DashboardStats {

    private long totalUsers;
    private long totalCandidates;
    private long totalRecruiters;
    private long totalJobs;
    private long activeJobs;
    private long pendingJobs;
    private long totalApplications;
    private int pendingApplications;

    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public void setTotalCandidates(long totalCandidates) { this.totalCandidates = totalCandidates; }
    public void setTotalRecruiters(long totalRecruiters) { this.totalRecruiters = totalRecruiters; }
    public void setTotalJobs(long totalJobs) { this.totalJobs = totalJobs; }
    public void setActiveJobs(long activeJobs) { this.activeJobs = activeJobs; }
    public void setPendingJobs(long pendingJobs) { this.pendingJobs = pendingJobs; }
    public void setTotalApplications(long totalApplications) { this.totalApplications = totalApplications; }
    public void setPendingApplications(int pendingApplications) { this.pendingApplications = pendingApplications; }
}
