package com.jobportal.repository;

import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.enums.JobStatus;
import com.jobportal.enums.JobType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, Long> {
    
    Page<Job> findByStatus(JobStatus status, Pageable pageable);
    Page<Job> findByRecruiterUserId(Long recruiterId, Pageable pageable);
    
    @Query("SELECT j FROM Job j WHERE j.status = 'APPROVED' AND " +
           "(LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(j.description) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(j.company) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(j.skills) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Job> searchJobs(@Param("keyword") String keyword, Pageable pageable);
    
    @Query("SELECT j FROM Job j WHERE j.status = 'APPROVED' AND " +
           "(:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%'))) AND " +
           "(:jobType IS NULL OR j.jobType = :jobType) AND " +
           "(:minSalary IS NULL OR j.minSalary >= :minSalary) AND " +
           "(:maxSalary IS NULL OR j.maxSalary <= :maxSalary) AND " +
           "(:skills IS NULL OR LOWER(j.skills) LIKE LOWER(CONCAT('%', :skills, '%')))")
    Page<Job> findJobsWithFilters(@Param("location") String location,
                                  @Param("jobType") JobType jobType,
                                  @Param("minSalary") BigDecimal minSalary,
                                  @Param("maxSalary") BigDecimal maxSalary,
                                  @Param("skills") String skills,
                                  Pageable pageable);
    
    List<Job> findByStatusAndApplicationDeadlineBefore(JobStatus status, LocalDateTime deadline);
    
    @Query("SELECT COUNT(j) FROM Job j WHERE j.status = :status")
    long countByStatus(@Param("status") JobStatus status);
    
    @Query("SELECT j FROM Job j WHERE j.status = 'APPROVED' ORDER BY j.createdAt DESC")
    List<Job> findLatestJobs(Pageable pageable);
    
    // ADD THIS NEW METHOD
    long countByRecruiterAndStatus(User recruiter, JobStatus status);
}