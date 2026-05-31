package com.alaya.service;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.Map;
import java.util.List;

@Service
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;
    private final WebClient webClient;

    @Value("${spring.mail.username}")
    private String smtpUsername;

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
        // Try Resend HTTP API first if API key is present and valid
        if (resendApiKey != null && resendApiKey.startsWith("re_") && !resendApiKey.contains("NO_KEY")) {
            try {
                sendEmailViaResend(to, subject, htmlContent);
                return;
            } catch (Exception e) {
                log.error("Resend HTTP API failed, falling back to SMTP. Error: {}", e.getMessage());
            }
        }

        // Fallback to SMTP
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            // Determine the best 'from' address
            String sender = "ashen.chamu123@gmail.com"; // Absolute default
            
            if (resendFromEmail != null && resendFromEmail.contains("@") && !resendFromEmail.contains("onboarding@resend.dev")) {
                sender = resendFromEmail;
            } else if (smtpUsername != null && smtpUsername.contains("@")) {
                sender = smtpUsername;
            } else if (resendFromEmail != null && !resendFromEmail.isBlank()) {
                sender = resendFromEmail; // Use onboarding@resend.dev if that's all we have
            }
            
            helper.setFrom("Alaya Master Coach <" + sender + ">");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("Email sent successfully via SMTP to {} from {}", to, sender);
        } catch (Exception e) {
            log.error("CRITICAL: Failed to send email via SMTP to {}. Error: {}", to, e.getMessage());
        }
    }

    private void sendEmailViaResend(String to, String subject, String htmlContent) {
        log.info("Attempting to send email via Resend HTTP API to {}", to);
        
        Map<String, Object> body = Map.of(
            "from", "Alaya Master Coach <" + resendFromEmail + ">",
            "to", List.of(to),
            "subject", subject,
            "html", htmlContent
        );

        webClient.post()
                .uri(resendApiUrl)
                .header("Authorization", "Bearer " + resendApiKey)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        
        log.info("Email sent successfully via Resend HTTP API to {}", to);
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
