package com.jobportal.config;

import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @PostConstruct
    public void init() {
        String userDir = System.getProperty("user.dir");
        Path uploadsPath = Paths.get(userDir).toAbsolutePath().normalize().resolve("uploads");
        
        System.out.println("========================================");
        System.out.println("Upload Configuration:");
        System.out.println("  User Directory: " + userDir);
        System.out.println("  Uploads Path: " + uploadsPath.toString());
        System.out.println("  Uploads exists: " + Files.exists(uploadsPath));
        
        File uploadsDir = uploadsPath.toFile();
        if (!uploadsDir.exists()) {
            boolean created = uploadsDir.mkdirs();
            System.out.println("  Created uploads dir: " + created);
        }
        
        File resumesDir = new File(uploadsDir, "resumes");
        File photosDir = new File(uploadsDir, "photos");
        
        if (!resumesDir.exists()) {
            resumesDir.mkdirs();
        }
        if (!photosDir.exists()) {
            photosDir.mkdirs();
        }
        
        System.out.println("  Resumes dir: " + resumesDir.getAbsolutePath() + " (exists: " + resumesDir.exists() + ")");
        System.out.println("  Photos dir: " + photosDir.getAbsolutePath() + " (exists: " + photosDir.exists() + ")");
        System.out.println("========================================");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String userDir = System.getProperty("user.dir");
        Path uploadsPath = Paths.get(userDir).toAbsolutePath().normalize().resolve("uploads");
        String uploadsFolder = uploadsPath.toString();
        
        String resourceLocation = "file:" + uploadsFolder + File.separator;
        
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(resourceLocation);
        
        System.out.println("[WebConfig] Static resource handler registered:");
        System.out.println("[WebConfig]   Pattern: /uploads/**");
        System.out.println("[WebConfig]   Location: " + resourceLocation);
    }
}
