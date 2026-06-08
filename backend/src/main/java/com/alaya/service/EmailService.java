package com.alaya.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final WebClient webClient;

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Value("${resend.api.url}")
    private String resendApiUrl;

    @Value("${resend.from.email}")
    private String resendFromEmail;

    public EmailService(JavaMailSender mailSender, WebClient.Builder webClientBuilder) {
        this.mailSender = mailSender;
        this.webClient = webClientBuilder.build();
    }

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        // Try Resend HTTP API first - This works on Railway because it uses Port 443 (HTTP)
        if (resendApiKey != null && !resendApiKey.equals("NO_KEY")) {
            try {
                sendEmailViaResend(to, subject, htmlContent);
                return;
            } catch (Exception e) {
                log.error("Resend HTTP API failed. Root cause: {}", e.getMessage());
                // Fall through to SMTP backup
            }
        }

        // Backup SMTP - Often blocked on Railway but useful for local testing
        try {
            log.info("Attempting backup SMTP delivery to {}", to);
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("Alaya Master Coach <ashen.chamu123@gmail.com>");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent successfully via SMTP backup to {}", to);
        } catch (Exception e) {
            log.error("CRITICAL: All email delivery methods failed for {}. Error: {}", to, e.getMessage());
        }
    }

    private void sendEmailViaResend(String to, String subject, String htmlContent) {
        log.info("Sending email to {} via Resend HTTP API", to);
        
        java.util.Map<String, Object> body = java.util.Map.of(
            "from", "Alaya Master Coach <" + resendFromEmail + ">",
            "to", java.util.List.of(to),
            "subject", subject,
            "html", htmlContent
        );

        webClient.post()
                .uri(resendApiUrl)
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(java.util.Map.class)
                .block();
        
        log.info("Email sent successfully via Resend HTTP API to {}", to);
    }

    public void sendWelcomeEmail(String to, String userName) {
        String subject = "Welcome to Alaya Master Coach! 🚀";
        String html = getWelcomeTemplate(userName);
        sendHtmlEmail(to, subject, html);
    }

    private String getWelcomeTemplate(String userName) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }" +
               "  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }" +
               "  .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px; text-align: center; color: #ffffff; }" +
               "  .content { padding: 40px; text-align: left; color: #333333; }" +
               "  .feature-list { margin: 25px 0; padding: 0; list-style-type: none; }" +
               "  .feature-item { margin-bottom: 12px; padding-left: 25px; position: relative; }" +
               "  .feature-item:before { content: '✓'; position: absolute; left: 0; color: #6366f1; font-weight: bold; }" +
               "  .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }" +
               "  .button { display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; box-shadow: 0 4px 6px rgba(99, 102, 241, 0.2); }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "  <div class='container'>" +
               "    <div class='header'><h1>Welcome to Alaya!</h1></div>" +
               "    <div class='content'>" +
               "      <p>Hi " + userName + ",</p>" +
               "      <p>We're absolutely thrilled to have you join <strong>Alaya Master Coach</strong>! Your journey to a healthier, more productive life starts right now.</p>" +
               "      <p>Here's what you can do next:</p>" +
               "      <ul class='feature-list'>" +
               "        <li class='feature-item'>Set your daily health and productivity goals</li>" +
               "        <li class='feature-item'>Log your meals and get instant AI nutrition analysis</li>" +
               "        <li class='feature-item'>Connect with your dedicated coach for personalized advice</li>" +
               "        <li class='feature-item'>Track your progress with AI-powered weekly reports</li>" +
               "      </ul>" +
               "      <p>Ready to get started? Log in to your dashboard and complete your first goal today!</p>" +
               "      <center><a href='https://alaya-coach.vercel.app' class='button'>Go to My Dashboard</a></center>" +
               "      <p style='margin-top: 30px;'>Stay focused,<br><strong>The Alaya Team</strong></p>" +
               "    </div>" +
               "    <div class='footer'>&copy; 2026 Alaya Master Coach. All rights reserved.</div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    public void sendOtpEmail(String to, String otp) {
        log.info("ALAYA SYSTEM - BACKUP OTP FOR {}: [{}]", to, otp);
        String subject = "Your Alaya Verification Code";
        String html = getOtpTemplate("Email Verification", otp, "verify your email address");
        sendHtmlEmail(to, subject, html);
    }

    public void sendPasswordResetOtpEmail(String to, String otp) {
        log.info("ALAYA SYSTEM - BACKUP PASSWORD RESET OTP FOR {}: [{}]", to, otp);
        String subject = "Alaya Password Reset Request";
        String html = getOtpTemplate("Password Reset", otp, "reset your password");
        sendHtmlEmail(to, subject, html);
    }

    public void sendGoalAddedEmail(String to, String userName, String goalTitle, String creatorName) {
        String subject = "New Goal Added to Your Alaya Dashboard";
        String html = getGoalTemplate(userName, goalTitle, creatorName);
        sendHtmlEmail(to, subject, html);
    }

    private String getGoalTemplate(String userName, String goalTitle, String creatorName) {
        String creatorText = creatorName != null ? "added by <strong>" + creatorName + "</strong>" : "added to your profile";
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }" +
               "  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }" +
               "  .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px; text-align: center; color: #ffffff; }" +
               "  .content { padding: 40px; text-align: left; color: #333333; }" +
               "  .goal-box { background-color: #f8fafc; border-left: 4px solid #6366f1; border-radius: 4px; padding: 20px; margin: 25px 0; font-size: 18px; font-weight: 600; color: #1e293b; }" +
               "  .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }" +
               "  .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 20px; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "  <div class='container'>" +
               "    <div class='header'><h1>Alaya Master Coach</h1></div>" +
               "    <div class='content'>" +
               "      <p>Hello " + userName + ",</p>" +
               "      <p>A new goal has been " + creatorText + ":</p>" +
               "      <div class='goal-box'>" + goalTitle + "</div>" +
               "      <p>Log in to your dashboard to track your progress and stay accountable!</p>" +
               "      <center><a href='https://alaya-master-coach.vercel.app' class='button'>View Dashboard</a></center>" +
               "    </div>" +
               "    <div class='footer'>&copy; 2026 Alaya Master Coach. All rights reserved.</div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }

    private String getOtpTemplate(String title, String otp, String action) {
        return "<!DOCTYPE html>" +
               "<html>" +
               "<head>" +
               "<style>" +
               "  body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; margin: 0; padding: 0; }" +
               "  .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }" +
               "  .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px; text-align: center; color: #ffffff; }" +
               "  .content { padding: 40px; text-align: center; color: #333333; }" +
               "  .otp-box { background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 8px; padding: 20px; margin: 30px 0; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #6366f1; }" +
               "  .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; }" +
               "  .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; }" +
               "</style>" +
               "</head>" +
               "<body>" +
               "  <div class='container'>" +
               "    <div class='header'><h1>Alaya Master Coach</h1></div>" +
               "    <div class='content'>" +
               "      <h2>" + title + "</h2>" +
               "      <p>Hello,</p>" +
               "      <p>Use the code below to " + action + ". This code is valid for <strong>5 minutes</strong>.</p>" +
               "      <div class='otp-box'>" + otp + "</div>" +
               "      <p>If you didn't request this, you can safely ignore this email.</p>" +
               "    </div>" +
               "    <div class='footer'>&copy; 2026 Alaya Master Coach. All rights reserved.</div>" +
               "  </div>" +
               "</body>" +
               "</html>";
    }
}
