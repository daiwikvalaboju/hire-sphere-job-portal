package com.jobportal.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.springframework.stereotype.Service;

import java.io.FileInputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeTextExtractorService {

    public String extractText(String filePath) throws IOException {
        String fileExtension = getFileExtension(filePath);
        
        switch (fileExtension.toLowerCase()) {
            case "pdf":
                return extractFromPDF(filePath);
            case "docx":
                return extractFromDOCX(filePath);
            case "doc":
                return extractFromDOC(filePath);
            default:
                throw new IOException("Unsupported file format: " + fileExtension);
        }
    }

    private String extractFromPDF(String filePath) throws IOException {
        try (PDDocument document = PDDocument.load(new FileInputStream(filePath))) {
            PDFTextStripper pdfStripper = new PDFTextStripper();
            return pdfStripper.getText(document);
        }
    }

    private String extractFromDOCX(String filePath) throws IOException {
        try (FileInputStream fis = new FileInputStream(filePath);
             XWPFDocument document = new XWPFDocument(fis);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }

    private String extractFromDOC(String filePath) throws IOException {
        try (FileInputStream fis = new FileInputStream(filePath);
             HWPFDocument document = new HWPFDocument(fis);
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }

    public String extractSkills(String text) {
        // Common technical skills keywords
        List<String> skillKeywords = Arrays.asList(
            "Java", "Python", "JavaScript", "React", "Angular", "Vue", "Node.js", "Spring", "Django",
            "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "HTML", "CSS", "Bootstrap", "Tailwind",
            "Git", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Jenkins", "CI/CD", "REST", "GraphQL",
            "Microservices", "Agile", "Scrum", "Machine Learning", "AI", "Data Science", "Hadoop", "Spark"
            );

        return skillKeywords.stream()
                .filter(skill -> text.toLowerCase().contains(skill.toLowerCase()))
                .collect(Collectors.joining(", "));
    }

    public String extractExperience(String text) {
        // Extract experience patterns
        Pattern experiencePattern = Pattern.compile(
            "(\\d+)\\s*(?:[-+]|to)?\\s*(\\d*)\\s*(?:years?|yrs?)\\s*(?:of\\s*)?(?:experience|exp)?",
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = experiencePattern.matcher(text);
        if (matcher.find()) {
            String years = matcher.group(1);
            String endYears = matcher.group(2);
            if (!endYears.isEmpty()) {
                return years + "-" + endYears + " years";
            } else {
                return years + " years";
            }
        }

        // Look for work experience sections
        Pattern workPattern = Pattern.compile(
            "(?:work\\s*experience|professional\\s*experience|employment\\s*history)([\\s\\S]*?)(?=education|skills|projects|$)",
            Pattern.CASE_INSENSITIVE
        );
        
        matcher = workPattern.matcher(text);
        if (matcher.find()) {
            String workSection = matcher.group(1).trim();
            if (workSection.length() > 100) {
                return workSection.substring(0, 100) + "...";
            }
            return workSection;
        }

        return "";
    }

    public String extractEducation(String text) {
        // Common education keywords
        List<String> educationKeywords = Arrays.asList(
            "Bachelor", "Master", "PhD", "Degree", "University", "College", "Institute",
            "B.Tech", "B.E.", "M.Tech", "M.E.", "MBA", "MCA", "BCA", "B.Sc", "M.Sc"
        );

        Pattern educationPattern = Pattern.compile(
            "(?:education|qualification|academic)([\\s\\S]*?)(?=experience|skills|projects|$)",
            Pattern.CASE_INSENSITIVE
        );
        
        Matcher matcher = educationPattern.matcher(text);
        if (matcher.find()) {
            String educationSection = matcher.group(1).trim();
            if (educationSection.length() > 200) {
                return educationSection.substring(0, 200) + "...";
            }
            return educationSection;
        }

        // Look for degree mentions in text
        String foundEducation = educationKeywords.stream()
                .filter(keyword -> text.toLowerCase().contains(keyword.toLowerCase()))
                .collect(Collectors.joining(", "));

        return foundEducation.isEmpty() ? "" : foundEducation;
    }

    private String getFileExtension(String filePath) {
        int lastDotIndex = filePath.lastIndexOf('.');
        return lastDotIndex > 0 ? filePath.substring(lastDotIndex + 1) : "";
    }
}