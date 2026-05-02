package com.jobportal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.io.File;

@EnableScheduling
@SpringBootApplication
public class JobPortalApplication {

    public static void main(String[] args) {
        createUploadDirectories();
        SpringApplication.run(JobPortalApplication.class, args);
    }

    private static void createUploadDirectories() {
        String userDir = System.getProperty("user.dir");
        File uploadsDir = new File(userDir + File.separator + "uploads");
        File resumesDir = new File(uploadsDir, "resumes");
        File photosDir = new File(uploadsDir, "photos");

        if (!uploadsDir.exists()) {
            uploadsDir.mkdirs();
        }
        if (!resumesDir.exists()) {
            resumesDir.mkdirs();
        }
        if (!photosDir.exists()) {
            photosDir.mkdirs();
        }
        
        System.out.println("Upload directories initialized at: " + uploadsDir.getAbsolutePath());
    }
}
