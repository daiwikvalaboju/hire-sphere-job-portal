package com.jobportal.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ApplicationRequest {
    @NotNull(message = "Job ID is required")
    private Long jobId;
    
    private Long resumeId;
    private String coverLetter;
}