package com.alaya;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;

@SpringBootApplication
@EnableAsync
@EnableScheduling
public class MasterCoachApplication {
    public static void main(String[] args) {
        SpringApplication.run(MasterCoachApplication.class, args);
    }

    @Bean
    public CommandLineRunner testDatabaseConnection(DataSource dataSource) {
        return args -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                System.out.println("[OK] DATABASE CONNECTION SUCCESSFUL!");
                System.out.println("Connected to: " + conn.getMetaData().getURL());
                System.out.println("Database User: " + conn.getMetaData().getUserName());
                
                System.out.println("Verifying and altering goals table for missing columns...");
                stmt.execute("ALTER TABLE goals ADD COLUMN IF NOT EXISTS nearing_reminder_sent boolean DEFAULT false;");
                stmt.execute("ALTER TABLE goals ADD COLUMN IF NOT EXISTS expired_reminder_sent boolean DEFAULT false;");
                System.out.println("[OK] goals table columns verified successfully!");
            } catch (Exception e) {
                System.err.println("[ERROR] DATABASE CONNECTION OR SCHEMA VERIFICATION FAILED!");
                System.err.println("Error: " + e.getMessage());
            }
        };
    }
}
