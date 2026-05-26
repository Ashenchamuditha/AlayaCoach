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
        
        String cleanHost = (host != null) ? host.trim() : "smtp.gmail.com";
        mailSender.setHost(cleanHost);
        
        // If port is 465, we use SSL. If it's 587, we use STARTTLS.
        // We'll favor 465 for Railway if 587 is timing out.
        mailSender.setPort(port);
        
        mailSender.setUsername((username != null) ? username.trim() : "");
        mailSender.setPassword((password != null) ? password.trim() : "");

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        
        if (port == 465) {
            props.put("mail.smtp.socketFactory.port", "465");
            props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            props.put("mail.smtp.ssl.enable", "true");
        } else {
            props.put("mail.smtp.starttls.enable", "true");
        }
        
        props.put("mail.debug", "true"); // Enabling debug to see exact handshake in Railway logs
        
        props.put("mail.smtp.timeout", "10000");
        props.put("mail.smtp.connectiontimeout", "10000");
        props.put("mail.smtp.writetimeout", "10000");

        return mailSender;
    }
}
