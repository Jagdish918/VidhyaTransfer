import { Router } from "express";
import {
  googleAuthCallback,
  googleAuthHandler,
  handleGoogleLoginCallback,
  handleLogout,
  registerWithEmailPassword,
  loginWithEmailPassword,
  forgotPassword,
  resetPassword,
  changePassword,
  sendRegistrationOtp,
  verifyRegistrationOtp,
  sendLoginOtp,
  loginWithOtp,
  loginAdmin
} from "../controllers/auth/auth.controllers.js";
import { authLimiter, emailLimiter } from "../middlewares/rateLimiter.middleware.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = Router();

// Google OAuth routes
router.get("/google", googleAuthHandler);
router.get("/google/callback", googleAuthCallback, handleGoogleLoginCallback);

// Admin Login — strict rate limit
router.post("/admin/login", authLimiter, loginAdmin);

// Email/Password routes
router.post("/register", authLimiter, registerWithEmailPassword);
router.post("/login", authLimiter, loginWithEmailPassword);
router.post("/forgot-password", emailLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);
router.post("/change-password", verifyJWT_username, authLimiter, changePassword);
router.post("/send-registration-otp", emailLimiter, sendRegistrationOtp);
router.post("/verify-registration-otp", authLimiter, verifyRegistrationOtp);

// Login OTP Routes — email limiter for sending, auth limiter for verifying
router.post("/send-otp", emailLimiter, sendLoginOtp);
router.post("/login-with-otp", authLimiter, loginWithOtp);

// Logout — POST (not GET) to prevent accidental/prefetch-triggered logouts
// verifyJWT_username needed so we can read the token and increment tokenVersion
router.post("/logout", verifyJWT_username, handleLogout);

export default router;
