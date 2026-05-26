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
        // Force IPv4 to prevent connection issues on some cloud networks
        System.setProperty("java.net.preferIPv4Stack", "true");
        
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        
        // Respect the host from Environment, default to Gmail
        String cleanHost = (host != null && !host.isBlank()) ? host.trim() : "smtp.gmail.com";
        mailSender.setHost(cleanHost);
        
        // Use port from environment, default to 587
        int cleanPort = (port == 0) ? 587 : port;
        mailSender.setPort(cleanPort);
        
        mailSender.setUsername((username != null) ? username.trim() : "");
        mailSender.setPassword((password != null) ? password.trim() : "");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.ssl.protocols", "TLSv1.2 TLSv1.3");
        
        if (cleanPort == 465) {
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.ssl.enable", "true");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.smtp.starttls.required", "true");
        }
        
        props.put("mail.debug", "true");
        props.put("mail.smtp.timeout", "15000");
        props.put("mail.smtp.connectiontimeout", "15000");
        props.put("mail.smtp.writetimeout", "15000");

        return mailSender;
    }
}
