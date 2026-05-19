package com.alaya.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    public void sendEmail(String to, String subject, String body) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom("Alaya Master Coach <no-reply@alaya.com>");
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        mailSender.send(message);
    }

    public void sendOtpEmail(String to, String otp) {
        String subject = "Your Alaya Verification Code";
        String body = "Welcome to Alaya! Your verification code is: " + otp + 
                      "\n\nThis code will expire in 10 minutes.";
        sendEmail(to, subject, body);
    }

    public void sendPasswordResetOtpEmail(String to, String otp) {
        String subject = "Alaya Password Reset Request";
        String body = "We received a request to reset your password. Use the following code to proceed: " + otp + 
                      "\n\nIf you didn't request this, you can safely ignore this email.";
        sendEmail(to, subject, body);
    }
}
