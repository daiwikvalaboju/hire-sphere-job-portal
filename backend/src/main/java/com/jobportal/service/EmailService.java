package com.jobportal.service;

import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    // ================= CONFIGURABLE VALUES (Change these as needed) =================
    // Company Email - shown in emails for contact
    private final String COMPANY_EMAIL = "support@hiresphere.com";
    
    // Company Website
    private final String COMPANY_WEBSITE = "www.hiresphere.com";
    
    // Company Logo URL - Replace with your actual logo URL
    private final String COMPANY_LOGO_URL = "https://i.imgur.com/logo-placeholder.png";
    
    // Company Address
    private final String COMPANY_ADDRESS = "Bangalore, Karnataka, India";
    
    // Support Phone
    private final String SUPPORT_PHONE = "+91 98765 43210";

    // ================= BASE METHOD (HTML ENABLED) =================
    public void sendEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true);

            helper.setFrom("hiresphere.admin@gmail.com", "HireSphere");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // ================= WELCOME EMAIL - JOB SEEKER =================
    public void sendWelcomeEmail(String to, String name) {
        String subject = "Welcome to HireSphere - Your Career Journey Starts Here!";
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "Welcome to HireSphere", 
            "Job Seeker",
            "<p>We're thrilled to have you on board, <strong>" + name + "</strong>!</p>" +
            "<p>You've taken the first step towards finding your dream career. Here's what you can do:</p>" +
            "<div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>" +
            "  <h4 style='margin: 0 0 15px; color: #1e293b;'>🚀 Get Started:</h4>" +
            "  <ul style='margin: 0; padding-left: 20px; color: #64748b; line-height: 2;'>" +
            "    <li>Complete your professional profile</li>" +
            "    <li>Upload your resume</li>" +
            "    <li>Browse thousands of jobs across India</li>" +
            "    <li>Apply to positions matching your skills</li>" +
            "    <li>Track your applications in real-time</li>" +
            "  </ul>" +
            "</div>" +
            "<p>Need help? Our support team is here for you.</p>"
        );
        
        sendEmail(to, subject, html);
    }

    // ================= WELCOME EMAIL - RECRUITER =================
    public void sendWelcomeEmailRecruiter(String to, String companyName) {
        String subject = "Welcome to HireSphere - Start Hiring Top Talent!";
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "Welcome to HireSphere", 
            "Employer",
            "<p>Welcome to HireSphere, <strong>" + companyName + "</strong>!</p>" +
            "<p>You're now part of India's fastest-growing hiring platform. Here's how to get started:</p>" +
            "<div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;'>" +
            "  <h4 style='margin: 0 0 15px; color: #1e293b;'>📢 Start Hiring:</h4>" +
            "  <ul style='margin: 0; padding-left: 20px; color: #64748b; line-height: 2;'>" +
            "    <li>Post your first job listing</li>" +
            "    <li>Build your company profile</li>" +
            "    <li>Browse candidate profiles</li>" +
            "    <li>Review applications instantly</li>" +
            "    <li>Connect with qualified candidates</li>" +
            "  </ul>" +
            "</div>" +
            "<p>Questions? We're here to help you hire better.</p>"
        );
        
        sendEmail(to, subject, html);
    }

    // ================= RECRUITER APPLICATION NOTIFICATION =================
    public void sendApplicationNotification(String recruiterEmail,
                                            String jobTitle,
                                            String candidateName,
                                            String candidateEmail) {
        
        String subject = "🔔 New Application Received for " + jobTitle;
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "New Job Application", 
            "Employer",
            "<p>A new candidate has applied for your job posting!</p>" +
            "<div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;'>" +
            "  <h4 style='margin: 0 0 15px; color: #1e293b;'>📋 Application Details:</h4>" +
            "  <p style='margin: 10px 0;'><strong>Position:</strong> " + jobTitle + "</p>" +
            "  <p style='margin: 10px 0;'><strong>Candidate Name:</strong> " + candidateName + "</p>" +
            "  <p style='margin: 10px 0;'><strong>Email:</strong> <a href='mailto:" + candidateEmail + "' style='color: #2563eb;'>" + candidateEmail + "</a></p>" +
            "</div>" +
            "<p>Log in to your HireSphere dashboard to review the full application.</p>"
        );
        
        sendEmail(recruiterEmail, subject, html);
    }

    // ================= APPLICATION STATUS UPDATE =================
    public void sendApplicationStatusUpdate(String candidateEmail,
                                            String candidateName,
                                            String jobTitle,
                                            String companyName,
                                            String status) {
        
        String statusEmoji = getStatusEmoji(status);
        String statusColor = getStatusColor(status);
        
        String subject = statusEmoji + " Application Update - " + jobTitle + " at " + companyName;
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "Application Status Update", 
            "Candidate",
            "<p>Hi <strong>" + candidateName + "</strong>,</p>" +
            "<p>Your application status has been updated. Here's the latest:</p>" +
            "<div style='background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; text-align: center;'>" +
            "  <p style='margin: 0 0 8px; color: #64748b; font-size: 14px;'>Position</p>" +
            "  <h3 style='margin: 0 0 15px; color: #1e293b; font-size: 18px;'>" + jobTitle + "</h3>" +
            "  <p style='margin: 0 0 8px; color: #64748b; font-size: 14px;'>at</p>" +
            "  <h4 style='margin: 0 0 20px; color: #2563eb;'>" + companyName + "</h4>" +
            "  <div style='background: " + statusColor + "; color: white; padding: 12px 28px; border-radius: 25px; display: inline-block; font-weight: 600; font-size: 15px;'>" +
            "    " + statusEmoji + " " + formatStatus(status) +
            "  </div>" +
            "</div>" +
            "<p>Log in to your HireSphere dashboard for more details.</p>"
        );
        
        sendEmail(candidateEmail, subject, html);
    }

    // ================= PASSWORD RESET EMAIL =================
    public void sendPasswordResetEmail(String to, String name, String resetToken) {
        String subject = "🔐 Reset Your HireSphere Password";
        
        String resetLink = "https://hiresphere.com/reset-password?token=" + resetToken;
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "Password Reset Request", 
            null,
            "<p>Hi <strong>" + name + "</strong>,</p>" +
            "<p>We received a request to reset your password. Click the button below to create a new password:</p>" +
            "<div style='text-align: center; margin: 30px 0;'>" +
            "  <a href='" + resetLink + "' style='background: #2563eb; color: white; padding: 16px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 15px;'>Reset Password</a>" +
            "</div>" +
            "<p style='color: #64748b; font-size: 14px;'>⏰ This link will expire in 24 hours.</p>" +
            "<hr style='border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;'>" +
            "<p style='color: #64748b; font-size: 13px; margin: 0;'>" +
            "  <strong>Security Note:</strong> If you didn't request this, please ignore this email. Your password will remain unchanged." +
            "</p>"
        );
        
        sendEmail(to, subject, html);
    }

    // ================= JOB POSTED CONFIRMATION =================
    public void sendJobPostedConfirmation(String recruiterEmail, String companyName, String jobTitle) {
        String subject = "✅ Job Posted Successfully - " + jobTitle;
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "Job Posted Successfully", 
            "Employer",
            "<p>Great news, <strong>" + companyName + "</strong>! Your job posting is now live.</p>" +
            "<div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;'>" +
            "  <h4 style='margin: 0 0 15px; color: #1e293b;'>📌 Job Details:</h4>" +
            "  <p style='margin: 10px 0;'><strong>Job Title:</strong> " + jobTitle + "</p>" +
            "  <p style='margin: 10px 0;'><strong>Company:</strong> " + companyName + "</p>" +
            "</div>" +
            "<p>You'll receive email notifications when candidates apply. Good luck finding the perfect candidate!</p>"
        );
        
        sendEmail(recruiterEmail, subject, html);
    }

    // ================= LOGIN ALERT EMAIL =================
    public void sendLoginAlertEmail(String to, String name, String role) {
        String userType = role.equals("RECRUITER") ? "Employer" : "Job Seeker";
        String subject = "🔔 New Login to Your HireSphere Account";
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "New Login Detected", 
            userType,
            "<p>Hi <strong>" + name + "</strong>,</p>" +
            "<p>We noticed a new sign-in to your HireSphere account.</p>" +
            "<div style='background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;'>" +
            "  <p style='margin: 10px 0; color: #64748b; font-size: 14px;'>✅ If this was you, no action is needed.</p>" +
            "  <p style='margin: 10px 0; color: #64748b; font-size: 14px;'>❌ If you didn't sign in, please <a href='#' style='color: #dc2626; font-weight: 600;'>reset your password</a> immediately.</p>" +
            "</div>" +
            "<p style='color: #64748b; font-size: 13px;'><strong>Security Tip:</strong> Never share your password with anyone. HireSphere will never ask for your password.</p>"
        );
        
        sendEmail(to, subject, html);
    }

    // ================= INTERVIEW SCHEDULED EMAIL =================
    public void sendInterviewScheduledEmail(String candidateEmail, String candidateName, 
                                            String jobTitle, String companyName,
                                            String interviewDate, String interviewTime, String interviewMode) {
        String subject = "📅 Interview Scheduled - " + jobTitle + " at " + companyName;
        
        String html = buildProfessionalTemplate(
            "https://i.imgur.com/logo-placeholder.png",
            "Interview Scheduled!", 
            "Candidate",
            "<p>Hi <strong>" + candidateName + "</strong>,</p>" +
            "<p>Great news! You've been selected for an interview.</p>" +
            "<div style='background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 25px; border-radius: 12px; margin: 25px 0; color: white; text-align: center;'>" +
            "  <h3 style='margin: 0 0 20px; font-size: 20px;'>Interview Details</h3>" +
            "  <p style='margin: 10px 0; font-size: 16px;'><strong>" + jobTitle + "</strong></p>" +
            "  <p style='margin: 10px 0; font-size: 16px;'>at <strong>" + companyName + "</strong></p>" +
            "  <div style='background: rgba(255,255,255,0.2); padding: 15px; border-radius: 8px; margin-top: 20px;'>" +
            "    <p style='margin: 8px 0;'><i class='fas fa-calendar'></i> 📅 " + interviewDate + "</p>" +
            "    <p style='margin: 8px 0;'><i class='fas fa-clock'></i> ⏰ " + interviewTime + "</p>" +
            "    <p style='margin: 8px 0;'><i class='fas fa-video'></i> 📍 " + interviewMode + "</p>" +
            "  </div>" +
            "</div>" +
            "<p>Log in to your HireSphere dashboard for more details and to prepare for your interview. Good luck!</p>"
        );
        
        sendEmail(candidateEmail, subject, html);
    }

    // ================= PROFESSIONAL EMAIL TEMPLATE =================
    private String buildProfessionalTemplate(String logoUrl, String title, String userType, String content) {
        String userTypeBadge = userType != null ? 
            "<span style='background: rgba(255,255,255,0.15); padding: 4px 12px; border-radius: 15px; font-size: 12px; margin-left: 10px;'>" + userType + "</span>" : "";
        
        return "<!DOCTYPE html>" +
        "<html>" +
        "<head>" +
        "  <meta charset='UTF-8'>" +
        "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
        "</head>" +
        "<body style='margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, sans-serif;'>" +
        "  <table width='100%' cellpadding='0' cellspacing='0' style='background-color: #f1f5f9; padding: 40px 20px;'>" +
        "    <tr>" +
        "      <td align='center'>" +
        "        <table width='100%' cellpadding='0' cellspacing='0' style='max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);'>" +
        "          <!-- Header with Logo -->" +
        "          <tr>" +
        "            <td style='background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 30px 40px;'>" +
        "              <table width='100%' cellpadding='0' cellspacing='0'>" +
        "                <tr>" +
        "                  <td style='vertical-align: middle;'>" +
        "                    <img src='" + logoUrl + "' alt='HireSphere' style='height: 40px; vertical-align: middle; margin-right: 15px; border-radius: 8px;'>" +
        "                    <h1 style='margin: 0; display: inline; color: #ffffff; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; vertical-align: middle;'>HireSphere</h1>" +
        "                    " + userTypeBadge +
        "                  </td>" +
        "                </tr>" +
        "              </table>" +
        "            </td>" +
        "          </tr>" +
        "          <!-- Content -->" +
        "          <tr>" +
        "            <td style='padding: 40px;'>" +
        "              <h2 style='margin: 0 0 25px; color: #1e293b; font-size: 24px; font-weight: 700;'>" + title + "</h2>" +
        "              <div style='color: #334155; font-size: 16px; line-height: 1.7;'>" +
        "                " + content +
        "              </div>" +
        "            </td>" +
        "          </tr>" +
        "          <!-- Contact Info Box -->" +
        "          <tr>" +
        "            <td style='padding: 0 40px 30px;'>" +
        "              <div style='background: #f8fafc; padding: 20px; border-radius: 10px; border: 1px solid #e2e8f0;'>" +
        "                <p style='margin: 0 0 12px; color: #1e293b; font-weight: 600; font-size: 14px;'>📞 Need Help? Contact Us</p>" +
        "                <p style='margin: 6px 0; color: #64748b; font-size: 13px;'>✉️ Email: <a href='mailto:" + COMPANY_EMAIL + "' style='color: #2563eb; text-decoration: none;'>" + COMPANY_EMAIL + "</a></p>" +
        "                <p style='margin: 6px 0; color: #64748b; font-size: 13px;'>🌐 Website: <a href='https://" + COMPANY_WEBSITE + "' style='color: #2563eb; text-decoration: none;'>" + COMPANY_WEBSITE + "</a></p>" +
        "                <p style='margin: 6px 0; color: #64748b; font-size: 13px;'>📍 " + COMPANY_ADDRESS + "</p>" +
        "              </div>" +
        "            </td>" +
        "          </tr>" +
        "          <!-- Footer -->" +
        "          <tr>" +
        "            <td style='background: #0f172a; padding: 25px 40px;'>" +
        "              <table width='100%' cellpadding='0' cellspacing='0'>" +
        "                <tr>" +
        "                  <td align='center'>" +
        "                    <p style='margin: 0 0 10px; color: #94a3b8; font-size: 13px;'>© 2026 HireSphere. All rights reserved.</p>" +
        "                    <p style='margin: 0; color: #64748b; font-size: 12px;'>" +
        "                      <a href='https://" + COMPANY_WEBSITE + "/privacy' style='color: #94a3b8; text-decoration: none; margin: 0 8px;'>Privacy Policy</a> | " +
        "                      <a href='https://" + COMPANY_WEBSITE + "/terms' style='color: #94a3b8; text-decoration: none; margin: 0 8px;'>Terms of Service</a> | " +
        "                      <a href='https://" + COMPANY_WEBSITE + "/contact' style='color: #94a3b8; text-decoration: none; margin: 0 8px;'>Contact Us</a>" +
        "                    </p>" +
        "                  </td>" +
        "                </tr>" +
        "              </table>" +
        "            </td>" +
        "          </tr>" +
        "        </table>" +
        "      </td>" +
        "    </tr>" +
        "  </table>" +
        "</body>" +
        "</html>";
    }

    // ================= HELPER METHODS =================
    private String getStatusEmoji(String status) {
        switch (status.toUpperCase()) {
            case "SHORTLISTED": return "🎉";
            case "INTERVIEW_SCHEDULED": return "📅";
            case "ACCEPTED": return "✅";
            case "REJECTED": return "❌";
            case "WITHDRAWN": return "↩️";
            default: return "📋";
        }
    }

    private String getStatusColor(String status) {
        switch (status.toUpperCase()) {
            case "SHORTLISTED": return "#10b981";
            case "INTERVIEW_SCHEDULED": return "#2563eb";
            case "ACCEPTED": return "#059669";
            case "REJECTED": return "#dc2626";
            case "WITHDRAWN": return "#64748b";
            default: return "#f59e0b";
        }
    }

    private String formatStatus(String status) {
        switch (status.toUpperCase()) {
            case "PENDING": return "Under Review";
            case "REVIEWED": return "Reviewed";
            case "SHORTLISTED": return "Shortlisted";
            case "INTERVIEW_SCHEDULED": return "Interview Scheduled";
            case "ACCEPTED": return "Accepted";
            case "REJECTED": return "Not Selected";
            case "WITHDRAWN": return "Withdrawn";
            default: return status;
        }
    }
}
