package com.alaya.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import java.util.Properties;

@Configuration
public class MailConfig {

    @Value("${spring.mail.host}")
    private String host;

    @Value("${spring.mail.port}")
    private int port;

    @Value("${spring.mail.username}")
    private String username;

    @Value("${spring.mail.password}")
    private String password;

    @Bean
    public JavaMailSender javaMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        // Use Resend as the primary production host
        String cleanHost = (host != null && !host.contains("gmail")) ? host.trim() : "smtp.resend.com";
        mailSender.setHost(cleanHost);
        
        // Port 587 is standard for Resend
        mailSender.setPort(port == 0 || port == 465 ? 587 : port);
        
        // For Resend, username is ALWAYS "resend"
        if (cleanHost.contains("resend")) {
            mailSender.setUsername("resend");
        } else {
            mailSender.setUsername((username != null) ? username.trim() : "");
        }
        
        mailSender.setPassword((password != null) ? password.trim() : "");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.starttls.required", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2");
        
        props.put("mail.debug", "true");
        
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");

        return mailSender;
    }
}
