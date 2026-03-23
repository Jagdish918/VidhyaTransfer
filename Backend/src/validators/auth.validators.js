import { z } from "zod";

/**
 * Authentication Route Schema Definitions
 */

export const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Please provide a valid email address"),
        password: z.string().min(1, "Password is required"),
    }),
});

export const registerSchema = z.object({
    body: z.object({
        name: z.string().trim().min(3, "Name must be at least 3 characters long"),
        email: z.string().email("Please provide a valid email address"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

export const otpSchema = z.object({
    body: z.object({
        email: z.string().email("Please provide a valid email address"),
        otp: z.string().length(6, "OTP must be 6 digits long"),
    }),
});

export const forgotPasswordSchema = z.object({
    body: z.object({
        email: z.string().email("Please provide a valid email address"),
    }),
});

export const resetPasswordSchema = z.object({
    body: z.object({
        resetToken: z.string().min(1, "Reset token is required"),
        newPassword: z.string().min(8, "Password must be at least 8 characters long"),
    }),
});

export const changePasswordSchema = z.object({
    body: z.object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    }),
});
