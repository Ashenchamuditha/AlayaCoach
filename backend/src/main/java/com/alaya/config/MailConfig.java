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
        // Force IPv4
        System.setProperty("java.net.preferIPv4Stack", "true");
        
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        String cleanHost = (host != null && !host.isBlank()) ? host.trim() : "smtp.gmail.com";
        mailSender.setHost(cleanHost);
        
        int cleanPort = (port == 0) ? 465 : port; // Default to 465 for SSL
        mailSender.setPort(cleanPort);
        
        mailSender.setUsername((username != null) ? username.trim() : "");
        mailSender.setPassword((password != null) ? password.trim() : "");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        
        if (cleanPort == 465) {
            // SSL Settings for Port 465
            props.put("mail.smtp.ssl.enable", "true");
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.socketFactory.fallback", "false");
        } else {
            // STARTTLS Settings for Port 587
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }

        props.put("mail.smtp.ssl.trust", "smtp.gmail.com");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");
        props.put("mail.debug", "true");

        return mailSender;
    }
}
