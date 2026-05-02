package com.jobportal.scheduler;

import com.jobportal.entity.Notification;
import com.jobportal.repository.NotificationRepository;
import com.jobportal.service.EmailService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class NotificationScheduler {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private EmailService emailService;

    @Scheduled(fixedRate = 60000) // runs every 1 minute
    public void processPendingNotifications() {

        List<Notification> pendingNotifications =
                notificationRepository.findByEmailStatus("PENDING");

        for (Notification notification : pendingNotifications) {

            try {

                String userEmail = notification.getUser().getEmail();

                // ✅ Use existing sendEmail method
                emailService.sendEmail(
                        userEmail,
                        "HIRE SPHERE Notification",
                        "<p>" + notification.getMessage() + "</p>"
                );

                notification.setEmailStatus("SUCCESS");
                notification.setIsEmailSent(true);
                notification.setEmailSentAt(LocalDateTime.now());

            } catch (Exception e) {

                notification.setEmailStatus("FAILED");
            }

            notificationRepository.save(notification);
        }
    }
}