package com.mediconnect.util;

public class UserContext {
    private static final ThreadLocal<String> currentUserEmail = new ThreadLocal<>();
    private static final ThreadLocal<String> currentUserRole = new ThreadLocal<>();

    public static void setCurrentUser(String email, String role) {
        currentUserEmail.set(email);
        currentUserRole.set(role);
    }

    public static String getCurrentUserEmail() {
        return currentUserEmail.get();
    }

    public static String getCurrentUserRole() {
        return currentUserRole.get();
    }

    public static void clear() {
        currentUserEmail.remove();
        currentUserRole.remove();
    }
} 