package com.jobportal.dto;

public class AuthResponse {

    private String message;
    private String token;
    private String role;

    // ✅ REQUIRED no-args constructor
    public AuthResponse() {
    }

    // ✅ REQUIRED 3-args constructor
    public AuthResponse(String message, String token, String role) {
        this.message = message;
        this.token = token;
        this.role = role;
    }

    // getters & setters
    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}
