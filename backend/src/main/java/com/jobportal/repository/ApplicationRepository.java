package com.jobportal.repository;

import com.jobportal.entity.Application;
import com.jobportal.entity.Job;
import com.jobportal.entity.User;
import com.jobportal.enums.ApplicationStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    
    Page<Application> findByUserUserId(Long userId, Pageable pageable);
    Page<Application> findByJobJobId(Long jobId, Pageable pageable);
    
    @Query("SELECT a FROM Application a WHERE a.job.recruiter.userId = :recruiterId")
    Page<Application> findByRecruiterId(@Param("recruiterId") Long recruiterId, Pageable pageable);
    
    Optional<Application> findByUserUserIdAndJobJobId(Long userId, Long jobId);
    boolean existsByUserUserIdAndJobJobId(Long userId, Long jobId);
    List<Application> findByStatus(ApplicationStatus status);
    
    @Query("SELECT COUNT(a) FROM Application a WHERE a.job.recruiter.userId = :recruiterId AND a.status = :status")
    long countByRecruiterIdAndStatus(@Param("recruiterId") Long recruiterId, @Param("status") ApplicationStatus status);
    
    @Query("SELECT a FROM Application a WHERE a.status = :status ORDER BY a.aiMatchScore DESC")
    List<Application> findByStatusOrderByMatchScore(@Param("status") ApplicationStatus status, Pageable pageable);
    
    @Query("SELECT COUNT(a) FROM Application a WHERE a.user.userId = :userId AND a.status = :status")
    long countByUserIdAndStatus(@Param("userId") Long userId, @Param("status") ApplicationStatus status);
    
    // Methods for ApplicationService
    boolean existsByUserAndJob(User user, Job job);
    Page<Application> findByUserOrderByAppliedAtDesc(User user, Pageable pageable);
    long countByUser(User user);
    long countByUserAndStatus(User user, ApplicationStatus status);
    
    // NEW METHODS FOR RECRUITER
    long countByJobRecruiterUserId(Long recruiterId);
    Page<Application> findByJobRecruiterUserId(Long recruiterId, Pageable pageable);
}