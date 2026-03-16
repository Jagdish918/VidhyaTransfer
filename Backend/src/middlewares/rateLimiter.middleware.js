import rateLimit from "express-rate-limit";

const IS_PROD = process.env.NODE_ENV === "production";

// ─── GLOBAL LIMITER ────────────────────────────────────────────────────────────
// In development all traffic comes from 127.0.0.1 (same IP for all apps),
// so a tight global limit would block the Admin panel + Frontend combined.
// Only enforce in production where real users have distinct IPs.
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PROD ? 200 : 10000,   // effectively unlimited in dev
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => !IS_PROD,         // skip entirely in development
    message: { success: false, message: "Too many requests, please try again later." },
});

// ─── AUTH LIMITER ──────────────────────────────────────────────────────────────
// Always enforced — brute-force attacks happen in dev too.
// 10 requests per 15 minutes per IP (login, register, OTP verify)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: IS_PROD ? 10 : 100,      // more relaxed in dev for testing
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many authentication attempts. Please wait 15 minutes." },
});

// ─── EMAIL LIMITER ─────────────────────────────────────────────────────────────
// Always enforced — prevents email spam and abuse.
// 5 requests per hour per IP (forgot-password, send-otp, schedule-meet)
export const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: IS_PROD ? 5 : 50,        // relaxed in dev for testing
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: "Too many email requests. Please try again in an hour." },
});
