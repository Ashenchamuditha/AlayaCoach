package com.alaya;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import javax.sql.DataSource;
import java.sql.Connection;

@SpringBootApplication
public class MasterCoachApplication {
    public static void main(String[] args) {
        SpringApplication.run(MasterCoachApplication.class, args);
    }

    @Bean
    public CommandLineRunner testDatabaseConnection(DataSource dataSource) {
        return args -> {
            try (Connection conn = dataSource.getConnection()) {
                System.out.println("[OK] DATABASE CONNECTION SUCCESSFUL!");
                System.out.println("Connected to: " + conn.getMetaData().getURL());
                System.out.println("Database User: " + conn.getMetaData().getUserName());
            } catch (Exception e) {
                System.err.println("[ERROR] DATABASE CONNECTION FAILED!");
                System.err.println("Error: " + e.getMessage());
            }
        };
    }
}
