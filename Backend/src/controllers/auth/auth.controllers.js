import { generateJWTToken_email, generateJWTToken_username } from "../../utils/generateJWTToken.js";
import jwt from "jsonwebtoken";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../../models/user.model.js";
import { UnRegisteredUser } from "../../models/unRegisteredUser.model.js";
import dotenv from "dotenv";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { sendMail } from "../../utils/SendMail.js";

dotenv.config();

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const IS_PROD = process.env.NODE_ENV === "production";

/**
 * Returns cookie options — secure:true in production (HTTPS only),
 * sameSite:"Lax" to prevent CSRF.
 */
function cookieOptions(expiryDate, httpOnly = true) {
  return {
    httpOnly,
    expires: expiryDate,
    secure: IS_PROD,       // ✅ FIX: true in prod — HTTPS only
    sameSite: IS_PROD ? "Strict" : "Lax",
    path: "/",
  };
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function verifyPassword(password, hashedPassword) {
  if (!hashedPassword) return false;

  // Legacy Check (PBKDF2)
  if (hashedPassword.includes(":")) {
    const [salt, hash] = hashedPassword.split(":");
    const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === verifyHash;
  }

  // Modern Check (Bcrypt)
  return await bcrypt.compare(password, hashedPassword);
}

// Frontend base URL — env-driven, never hardcoded
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// ─── PASSPORT / GOOGLE OAUTH ──────────────────────────────────────────────────

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      done(null, profile);
    }
  )
);

export const googleAuthHandler = passport.authenticate("google", {
  scope: ["profile", "email"],
});

export const googleAuthCallback = passport.authenticate("google", {
  failureRedirect: `${FRONTEND_URL}/login`,
  session: false,
});

export const handleGoogleLoginCallback = asyncHandler(async (req, res) => {
  const existingUser = await User.findOne({ email: req.user._json.email });

  if (existingUser) {
    if (existingUser.status === "banned") {
      return res.redirect(`${FRONTEND_URL}/login?error=account_banned`);
    }

    const jwtToken = generateJWTToken_username(existingUser);
    const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    res.cookie("accessToken", jwtToken, cookieOptions(expiryDate));
    res.cookie("hasSession", "true", cookieOptions(expiryDate, false));

    if (existingUser.onboardingCompleted) {
      return res.redirect(`${FRONTEND_URL}/feed`);
    } else {
      return res.redirect(`${FRONTEND_URL}/onboarding/personal-info`);
    }
  }

  let unregisteredUser = await UnRegisteredUser.findOne({ email: req.user._json.email });
  if (!unregisteredUser) {
    const googlePicture = req.user._json.picture || req.user.photos?.[0]?.value || "";
    unregisteredUser = await UnRegisteredUser.create({
      name: req.user._json.name,
      email: req.user._json.email,
      picture: googlePicture,
    });
  }
  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, cookieOptions(expiryDate));
  res.cookie("hasSession", "true", cookieOptions(expiryDate, false));
  return res.redirect(`${FRONTEND_URL}/onboarding/personal-info`);
});

// ─── EMAIL/PASSWORD REGISTRATION ─────────────────────────────────────────────

export const registerWithEmailPassword = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  let unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (!unregisteredUser) {
    unregisteredUser = await UnRegisteredUser.create({
      name,
      email,
      password: await hashPassword(password),
    });
  } else {
    unregisteredUser.password = await hashPassword(password);
    await unregisteredUser.save();
  }

  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 0.5 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, cookieOptions(expiryDate));
  res.cookie("hasSession", "true", cookieOptions(expiryDate, false));

  const userData = { ...unregisteredUser.toObject() };
  delete userData.password;

  return res.status(201).json(
    new ApiResponse(201, { user: userData }, "Registration successful")
  );
});

// ─── EMAIL/PASSWORD LOGIN ─────────────────────────────────────────────────────

export const loginWithEmailPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const registeredUser = await User.findOne({ email });
  if (registeredUser && registeredUser.password) {
    if (registeredUser.role === "admin") {
      throw new ApiError(403, "Admins must use the Admin Portal");
    }
    if (registeredUser.status === "banned") throw new ApiError(403, "Account suspended");
    if (registeredUser.isDeleted) throw new ApiError(403, "Account deleted");

    if (registeredUser.lockUntil && registeredUser.lockUntil > Date.now()) {
      throw new ApiError(429, `Account locked. Try again after ${new Date(registeredUser.lockUntil).toLocaleTimeString()}`);
    }

    if (await verifyPassword(password, registeredUser.password)) {
      registeredUser.loginAttempts = 0;
      registeredUser.lockUntil = undefined;
      registeredUser.lastLogin = Date.now();
      await registeredUser.save();

      const jwtToken = generateJWTToken_username(registeredUser);
      const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
      res.cookie("accessToken", jwtToken, cookieOptions(expiryDate));
      res.cookie("hasSession", "true", cookieOptions(expiryDate, false));

      const userData = { ...registeredUser.toObject() };
      delete userData.password;
      return res.status(200).json(new ApiResponse(200, { user: userData }, "Login successful"));
    } else {
      registeredUser.loginAttempts = (registeredUser.loginAttempts || 0) + 1;
      if (registeredUser.loginAttempts >= 5) {
        registeredUser.lockUntil = Date.now() + 15 * 60 * 1000;
      }
      await registeredUser.save();
      throw new ApiError(401, "Invalid email or password");
    }
  }

  const unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (unregisteredUser && unregisteredUser.password) {
    if (unregisteredUser.otp) {
      throw new ApiError(403, "Please complete email verification first");
    }

    if (await verifyPassword(password, unregisteredUser.password)) {
      const jwtToken = generateJWTToken_email(unregisteredUser);
      const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
      res.cookie("accessTokenRegistration", jwtToken, cookieOptions(expiryDate));
      res.cookie("hasSession", "true", cookieOptions(expiryDate, false));

      const userData = { ...unregisteredUser.toObject() };
      delete userData.password;
      return res.status(200).json(new ApiResponse(200, { user: userData }, "Login successful"));
    } else {
      throw new ApiError(401, "Invalid email or password");
    }
  }

  throw new ApiError(401, "Invalid email or password");
});

// ─── ADMIN LOGIN ─────────────────────────────────────────────────────────────

export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || !user.password) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  if (user.role !== "admin") {
    throw new ApiError(403, "Access denied. Not an admin.");
  }

  // ✅ FIX: Admin also gets brute-force lockout protection
  if (user.lockUntil && user.lockUntil > Date.now()) {
    throw new ApiError(429, `Account locked. Try again after ${new Date(user.lockUntil).toLocaleTimeString()}`);
  }

  if (await verifyPassword(password, user.password)) {
    // Reset lockout on success
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLogin = Date.now();
    await user.save();

    const jwtToken = generateJWTToken_username(user);
    const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    res.cookie("accessToken", jwtToken, cookieOptions(expiryDate));

    const userData = { ...user.toObject() };
    delete userData.password;

    return res.status(200).json(new ApiResponse(200, { user: userData }, "Admin Login successful"));
  } else {
    // ✅ FIX: Admin lockout after 5 failed attempts
    user.loginAttempts = (user.loginAttempts || 0) + 1;
    if (user.loginAttempts >= 5) {
      user.lockUntil = Date.now() + 30 * 60 * 1000; // 30 min lock for admins
    }
    await user.save();
    throw new ApiError(401, "Invalid admin credentials");
  }
});

// ─── LOGOUT ──────────────────────────────────────────────────────────────────

export const handleLogout = asyncHandler(async (req, res) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  try {
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (decoded?.username) {
        // ✅ JWT REVOCATION: Increment tokenVersion → instantly invalidates
        // this user's token on ALL devices, not just the current one.
        await User.findOneAndUpdate(
          { username: decoded.username },
          { $inc: { tokenVersion: 1 } }
        );
      }
    }
  } catch (_) {
    // Token might already be expired — still clear the cookies
  }

  const IS_PROD = process.env.NODE_ENV === "production";
  const cookieOpts = { path: "/", sameSite: IS_PROD ? "Strict" : "Lax" };
  res.clearCookie("accessToken", cookieOpts);
  res.clearCookie("accessTokenRegistration", cookieOpts);
  res.clearCookie("hasSession", cookieOpts);
  return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
});

// ─── PASSWORD RESET ───────────────────────────────────────────────────────────

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  // ✅ FIX: No longer throws 404 if user not found — prevents email enumeration
  const user = await User.findOne({ email });

  if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    const message = `
      <h1>Password Reset Request</h1>
      <p>You have requested a password reset. Click the link below to reset your password:</p>
      <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
      <p>This link expires in 1 hour. If you did not request this, please ignore this email.</p>
    `;

    try {
      await sendMail(user.email, "Password Reset Request", message);
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      // Don't expose that email sending failed — could leak email existence
    }
  }

  // ✅ Always return the same response regardless of whether the email exists
  return res.status(200).json(
    new ApiResponse(200, null, "If this email is registered, a password reset link has been sent.")
  );
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    throw new ApiError(400, "Reset token and new password are required");
  }

  if (newPassword.length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters long");
  }

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired reset token");

  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;
  user.passwordChangedAt = new Date();
  // ✅ JWT REVOCATION: Increment tokenVersion on password reset.
  // This kicks out ALL active sessions on ALL devices immediately.
  // Anyone who had the old token cannot use it anymore.
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Password reset successful. Please login again."));
});

// ─── REGISTRATION OTP ─────────────────────────────────────────────────────────

export const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  let unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (!unregisteredUser) {
    unregisteredUser = await UnRegisteredUser.create({
      name,
      email,
      password: await hashPassword(password),
      otp: await bcrypt.hash(otp, 10),  // ✅ FIX: Hash the OTP before saving
      otpExpires,
      otpAttempts: 0,
    });
  } else {
    unregisteredUser.name = name;
    unregisteredUser.password = await hashPassword(password);
    unregisteredUser.otp = await bcrypt.hash(otp, 10);  // ✅ FIX: Hash the OTP
    unregisteredUser.otpExpires = otpExpires;
    unregisteredUser.otpAttempts = 0;
    await unregisteredUser.save();
  }

  const message = `
    <h1>Registration OTP</h1>
    <p>Your OTP for registration is: <strong>${otp}</strong></p>
    <p>This OTP is valid for 10 minutes. Do not share it with anyone.</p>
  `;

  try {
    await sendMail(email, "Registration OTP - SkillSwap", message);
    return res.status(200).json(new ApiResponse(200, null, "OTP sent successfully"));
  } catch (error) {
    throw new ApiError(500, "Failed to send OTP email");
  }
});

export const verifyRegistrationOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    throw new ApiError(400, "Email and OTP are required");
  }

  const unregisteredUser = await UnRegisteredUser.findOne({ email });

  if (!unregisteredUser) {
    throw new ApiError(400, "User not found or registration session expired");
  }

  // ✅ FIX: Brute-force protection — lock after 5 wrong OTP attempts
  if (unregisteredUser.otpAttempts >= 5) {
    throw new ApiError(429, "Too many failed OTP attempts. Please request a new OTP.");
  }

  if (unregisteredUser.otpExpires < Date.now()) {
    throw new ApiError(400, "OTP has expired. Please request a new one.");
  }

  // ✅ FIX: Compare against hashed OTP
  const isOtpValid = await bcrypt.compare(otp, unregisteredUser.otp);
  if (!isOtpValid) {
    unregisteredUser.otpAttempts = (unregisteredUser.otpAttempts || 0) + 1;
    await unregisteredUser.save();
    throw new ApiError(400, "Invalid OTP");
  }

  // OTP is valid — clear it
  unregisteredUser.otp = undefined;
  unregisteredUser.otpExpires = undefined;
  unregisteredUser.otpAttempts = 0;
  await unregisteredUser.save();

  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 0.5 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, cookieOptions(expiryDate));
  res.cookie("hasSession", "true", cookieOptions(expiryDate, false));

  const userData = { ...unregisteredUser.toObject() };
  delete userData.password;
  delete userData.otp;
  delete userData.otpExpires;
  delete userData.otpAttempts;

  return res.status(201).json(
    new ApiResponse(201, { user: userData }, "Registration successful")
  );
});

// ─── LOGIN OTP ────────────────────────────────────────────────────────────────

export const sendLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  const user = await User.findOne({ email });

  // ✅ FIX: Don't reveal whether the email is registered — prevents email enumeration
  if (!user) {
    return res.status(200).json(
      new ApiResponse(200, null, "If this email is registered, an OTP has been sent.")
    );
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  user.otpAttempts = 0;
  await user.save();

  try {
    await sendMail(email, "Login OTP - SkillSwap", `<p>Your login OTP is: <strong>${otp}</strong>. Valid for 10 minutes.</p>`);
    return res.status(200).json(new ApiResponse(200, null, "OTP sent successfully"));
  } catch (err) {
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();
    throw new ApiError(500, "Failed to send OTP");
  }
});

export const loginWithOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) throw new ApiError(400, "Email and OTP are required");

  const user = await User.findOne({
    email,
    otpExpires: { $gt: Date.now() },
  });

  if (!user || !user.otp) throw new ApiError(400, "Invalid or expired OTP");

  if (user.role === "admin") {
    throw new ApiError(403, "Admins must use the Admin Portal");
  }

  // ✅ Brute-force protection for login OTP
  if ((user.otpAttempts || 0) >= 5) {
    throw new ApiError(429, "Too many failed OTP attempts. Please request a new OTP.");
  }

  const isOtpValid = await bcrypt.compare(otp, user.otp);

  if (!isOtpValid) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    await user.save();
    throw new ApiError(400, "Invalid or expired OTP");
  }

  // OTP valid — log in
  const jwtToken = generateJWTToken_username(user);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  res.cookie("accessToken", jwtToken, cookieOptions(expiryDate));
  res.cookie("hasSession", "true", cookieOptions(expiryDate, false));

  user.otp = undefined;
  user.otpExpires = undefined;
  user.otpAttempts = 0;
  await user.save();

  const userData = { ...user.toObject() };
  delete userData.password;
  delete userData.otp;

  return res.status(200).json(
    new ApiResponse(200, { user: userData }, "Login successful")
  );
});
