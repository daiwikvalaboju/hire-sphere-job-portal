package com.jobportal.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jobportal.service.EmailService;

@RestController
public class EmailTestController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/test-email")
    public String testEmail() {
        emailService.sendEmail(
                "daiwikvalaboju@gmail.com",
                "Spring Boot Test",
                "If you received this email, SMTP is working!"
        );
        return "Email Sent Successfully!";
    }
}
