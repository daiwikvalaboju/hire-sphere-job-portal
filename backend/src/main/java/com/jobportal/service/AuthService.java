package com.jobportal.service;

import com.jobportal.dto.RegisterRequest;
import com.jobportal.entity.User;
import com.jobportal.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private EmailService emailService;

    // ================= REGISTER =================
    @Transactional
    public User register(RegisterRequest request) throws Exception {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new Exception("Email already exists");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole());
        user.setPhone(request.getPhone());
        user.setLocation(request.getLocation());
        user.setBio(request.getBio());
        user.setSkills(request.getSkills());
        user.setExperience(request.getExperience());
        user.setEducation(request.getEducation());
        user.setIsActive(true);
        user.setEmailVerified(false);
        user.setCreatedAt(LocalDateTime.now());

        User savedUser = userRepository.save(user);

        // Send Welcome Email based on role
        if (savedUser.getRole().toString().equals("RECRUITER")) {
            emailService.sendWelcomeEmailRecruiter(
                    savedUser.getEmail(),
                    savedUser.getName()
            );
        } else {
            emailService.sendWelcomeEmail(
                    savedUser.getEmail(),
                    savedUser.getName()
            );
        }

        return savedUser;
    }

    // ================= LOGIN =================
    public User authenticate(String email, String password) throws Exception {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("Invalid email or password"));

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new Exception("Invalid email or password");
        }

        if (!user.getIsActive()) {
            throw new Exception("Account is deactivated");
        }

        // Send Login Alert Email with role
        emailService.sendLoginAlertEmail(
                user.getEmail(),
                user.getName(),
                user.getRole().toString()
        );

        return user;
    }

    // ================= PASSWORD RESET =================
    public void sendPasswordResetEmail(String email) throws Exception {

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new Exception("User not found"));

        String resetToken = UUID.randomUUID().toString();
        
        emailService.sendPasswordResetEmail(
                user.getEmail(),
                user.getName(),
                resetToken
        );
    }

    public void resetPassword(String token, String newPassword) throws Exception {
        throw new Exception("Password reset not yet implemented");
    }
}