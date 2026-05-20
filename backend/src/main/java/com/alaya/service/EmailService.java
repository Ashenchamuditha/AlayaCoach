package com.alaya.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendHtmlEmail(String to, String subject, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom("Alaya Master Coach <no-reply@alaya.com>");
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("Failed to send HTML email to {}: {}", to, e.getMessage());
            throw new RuntimeException("Could not send email. Please try again later.");
        }
    }

    public void sendOtpEmail(String to, String otp) {
        String subject = "Your Alaya Verification Code";
        String html = getOtpTemplate("Email Verification", otp, "verify your email address");
        sendHtmlEmail(to, subject, html);
    }

    public void sendPasswordResetOtpEmail(String to, String otp) {
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
