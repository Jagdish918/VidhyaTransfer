import { generateJWTToken_email, generateJWTToken_username } from "../../utils/generateJWTToken.js";
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
  failureRedirect: "http://localhost:5173/login",
  session: false,
});

export const handleGoogleLoginCallback = asyncHandler(async (req, res) => {
  console.log("\n******** Inside handleGoogleLoginCallback function ********");

  const existingUser = await User.findOne({ email: req.user._json.email });

  if (existingUser) {
    if (existingUser.status === 'banned') {
      return res.redirect(`http://localhost:5173/login?error=account_banned`);
    }

    const jwtToken = generateJWTToken_username(existingUser);
    const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
    res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
    // Set a non-httpOnly hint for the frontend to avoid unnecessary 401 calls
    res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false });
    // Check if onboarding is completed
    if (existingUser.onboardingCompleted) {
      return res.redirect(`http://localhost:5173/feed`);
    } else {
      return res.redirect(`http://localhost:5173/onboarding/personal-info`);
    }
  }

  let unregisteredUser = await UnRegisteredUser.findOne({ email: req.user._json.email });
  if (!unregisteredUser) {
    console.log("Creating new Unregistered User");
    unregisteredUser = await UnRegisteredUser.create({
      name: req.user._json.name,
      email: req.user._json.email,
      picture: req.user._json.picture,
    });
  }
  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
  res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false });
  // New users should go to onboarding
  return res.redirect("http://localhost:5173/onboarding/personal-info");
});

// Email/Password Registration
export const registerWithEmailPassword = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Check if unregistered user exists
  let unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (!unregisteredUser) {
    // Create unregistered user
    unregisteredUser = await UnRegisteredUser.create({
      name,
      email,
      password: await hashPassword(password),
    });
  } else {
    // Update password if unregistered user exists
    unregisteredUser.password = await hashPassword(password);
    await unregisteredUser.save();
  }

  // Generate JWT token
  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 0.5 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
  res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false });

  // Return user data without password
  const userData = { ...unregisteredUser.toObject() };
  delete userData.password;

  return res.status(201).json(
    new ApiResponse(201, { user: userData }, "Registration successful")
  );
});

// Email/Password Login (For Users)
export const loginWithEmailPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check if user exists (registered)
  const registeredUser = await User.findOne({ email });
  if (registeredUser && registeredUser.password) {
    // BLOCK ADMINS FROM USER LOGIN
    if (registeredUser.role === 'admin') {
      throw new ApiError(403, "Admins must use the Admin PortaL");
    }

    if (registeredUser.status === 'banned') throw new ApiError(403, "Account suspended");
    if (registeredUser.isDeleted) throw new ApiError(403, "Account deleted");

    if (registeredUser.lockUntil && registeredUser.lockUntil > Date.now()) {
      throw new ApiError(429, `Account locked. Try again after ${new Date(registeredUser.lockUntil).toLocaleTimeString()}`);
    }

    // Verify password
    if (await verifyPassword(password, registeredUser.password)) {
      registeredUser.loginAttempts = 0;
      registeredUser.lockUntil = undefined;
      registeredUser.lastLogin = Date.now();
      await registeredUser.save();

      const jwtToken = generateJWTToken_username(registeredUser);
      const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
      res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: false, sameSite: "Lax", path: "/" });
      res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false, sameSite: "Lax", path: "/" });
      // Return user data without password
      const userData = { ...registeredUser.toObject() };
      delete userData.password;
      return res.status(200).json(
        new ApiResponse(200, { user: userData }, "Login successful")
      );
    } else {
      registeredUser.loginAttempts = (registeredUser.loginAttempts || 0) + 1;
      if (registeredUser.loginAttempts >= 5) {
        registeredUser.lockUntil = Date.now() + 15 * 60 * 1000; // 15 min lock
      }
      await registeredUser.save();
      throw new ApiError(401, "Invalid email or password");
    }
  }

  // Check if unregistered user exists
  const unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (unregisteredUser && unregisteredUser.password) {
    // Prevent bypass of email verification
    if (unregisteredUser.otp) {
      throw new ApiError(403, "Please complete email verification first");
    }

    // Verify password
    if (await verifyPassword(password, unregisteredUser.password)) {
      const jwtToken = generateJWTToken_email(unregisteredUser);
      const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
      res.cookie("accessTokenRegistration", jwtToken, { httpOnly: true, expires: expiryDate, secure: false, sameSite: "Lax", path: "/" });
      res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false, sameSite: "Lax", path: "/" });
      // Return user data without password
      const userData = { ...unregisteredUser.toObject() };
      delete userData.password;
      return res.status(200).json(
        new ApiResponse(200, { user: userData }, "Login successful")
      );
    } else {
      throw new ApiError(401, "Invalid email or password");
    }
  }

  throw new ApiError(401, "Invalid email or password");
});

// Admin Login (Exclusive)
export const loginAdmin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  const user = await User.findOne({ email });

  if (!user || !user.password) {
    throw new ApiError(401, "Invalid admin credentials");
  }

  if (user.role !== 'admin') {
    throw new ApiError(403, "Access denied. Not an admin.");
  }

  if (await verifyPassword(password, user.password)) {
    user.lastLogin = Date.now();
    await user.save();

    const jwtToken = generateJWTToken_username(user);
    const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);

    // Cookie settings might need to be specific for admin if needed, but standard is fine
    res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: false, sameSite: "Lax", path: "/" });

    const userData = { ...user.toObject() };
    delete userData.password;

    return res.status(200).json(
      new ApiResponse(200, { user: userData }, "Admin Login successful")
    );
  } else {
    throw new ApiError(401, "Invalid admin credentials");
  }
});

// Helper function to hash password (async)
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Helper function to verify password (async, supports legacy pbkdf2)
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


export const handleLogout = (req, res) => {
  console.log("\n******** Inside handleLogout function ********");
  res.clearCookie("accessToken");
  res.clearCookie("accessTokenRegistration");
  res.clearCookie("hasSession");
  return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
};

export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  // Check User model
  const user = await User.findOne({ email });
  if (!user) throw new ApiError(404, "User not found");

  const token = crypto.randomBytes(20).toString("hex");
  user.resetPasswordToken = token;
  user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  await user.save();

  const resetUrl = `http://localhost:5173/reset-password/${token}`;
  const message = `
    <h1>Password Reset Request</h1>
    <p>You have requested a password reset. Please click the link below to reset your password:</p>
    <a href="${resetUrl}" clicktracking="off">${resetUrl}</a>
    <p>If you did not request this, please ignore this email.</p>
  `;

  try {
    await sendMail(user.email, "Password Reset Request", message);
    return res.status(200).json(new ApiResponse(200, null, "Email sent"));
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    throw new ApiError(500, "Email could not be sent");
  }
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = req.body;

  const user = await User.findOne({
    resetPasswordToken: resetToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new ApiError(400, "Invalid or expired token");

  user.password = await hashPassword(newPassword);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return res.status(200).json(new ApiResponse(200, null, "Password reset successful"));
});

export const sendRegistrationOtp = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, "Name, email, and password are required");
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, "User with this email already exists");
  }

  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  let unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (!unregisteredUser) {
    unregisteredUser = await UnRegisteredUser.create({
      name,
      email,
      password: await hashPassword(password),
      otp,
      otpExpires
    });
  } else {
    // Update existing unregistered user
    unregisteredUser.name = name;
    unregisteredUser.password = await hashPassword(password);
    unregisteredUser.otp = otp;
    unregisteredUser.otpExpires = otpExpires;
    await unregisteredUser.save();
  }

  const message = `
    <h1>Registration OTP</h1>
    <p>Your OTP for registration is: <strong>${otp}</strong></p>
    <p>This OTP is valid for 10 minutes.</p>
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

  if (unregisteredUser.otp !== otp) {
    throw new ApiError(400, "Invalid OTP");
  }

  if (unregisteredUser.otpExpires < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }

  unregisteredUser.otp = undefined;
  unregisteredUser.otpExpires = undefined;
  await unregisteredUser.save();

  const jwtToken = generateJWTToken_email(unregisteredUser);
  const expiryDate = new Date(Date.now() + 0.5 * 60 * 60 * 1000);
  res.cookie("accessTokenRegistration", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
  res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false });

  const userData = { ...unregisteredUser.toObject() };
  delete userData.password;
  delete userData.otp;
  delete userData.otpExpires;

  return res.status(201).json(
    new ApiResponse(201, { user: userData }, "Registration successful")
  );
});

export const sendLoginOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(400, "Email is required");

  let user = await User.findOne({ email });
  // If not found in User, check UnRegisteredUser? Usually login is for registered.
  // Assuming Login for Registered.
  if (!user) throw new ApiError(404, "User not found");

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.otp = await bcrypt.hash(otp, 10);
  user.otpExpires = Date.now() + 10 * 60 * 1000;
  await user.save();

  try {
    await sendMail(email, "Login OTP - SkillSwap", `Your login OTP is ${otp}`);
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
    otpExpires: { $gt: Date.now() }
  });

  if (!user || !user.otp) throw new ApiError(400, "Invalid or expired OTP");

  if (user.role === 'admin') {
    throw new ApiError(403, "Admins must use the Admin Portal");
  }

  const isOtpValid = await bcrypt.compare(otp, user.otp);

  if (!isOtpValid) throw new ApiError(400, "Invalid or expired OTP");

  // Login Success
  const jwtToken = generateJWTToken_username(user);
  const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
  res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: false, sameSite: "Lax", path: "/" });
  res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false, sameSite: "Lax", path: "/" });

  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const userData = { ...user.toObject() };
  delete userData.password;
  delete userData.otp;

  return res.status(200).json(
    new ApiResponse(200, { user: userData }, "Login successful")
  );
});
