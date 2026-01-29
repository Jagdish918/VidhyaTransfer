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
  sendRegistrationOtp,
  verifyRegistrationOtp
} from "../controllers/auth/auth.controllers.js";

const router = Router();

// Google OAuth routes
router.get("/google", googleAuthHandler);
router.get("/google/callback", googleAuthCallback, handleGoogleLoginCallback);

// Email/Password routes
router.post("/register", registerWithEmailPassword);
router.post("/login", loginWithEmailPassword);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/verify-registration-otp", verifyRegistrationOtp);

// Logout
router.get("/logout", handleLogout);

export default router;
