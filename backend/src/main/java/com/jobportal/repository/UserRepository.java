package com.jobportal.repository;

import com.jobportal.entity.User;
import com.jobportal.enums.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    List<User> findByRole(UserRole role);
    List<User> findByIsActive(Boolean isActive);
    
    // Methods needed by AdminService
    Page<User> findByRoleAndIsActive(UserRole role, Boolean isActive, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.role = 'CANDIDATE' AND " +
           "(LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.skills) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<User> searchCandidates(@Param("keyword") String keyword, Pageable pageable);
    
    // Methods needed by DashboardService
    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role AND u.isActive = true")
    long countActiveUsersByRole(@Param("role") UserRole role);
}