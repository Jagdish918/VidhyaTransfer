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
      password: hashPassword(password),
    });
  } else {
    // Update password if unregistered user exists
    unregisteredUser.password = hashPassword(password);
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

// Email/Password Login
export const loginWithEmailPassword = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required");
  }

  // Check if user exists (registered)
  const registeredUser = await User.findOne({ email });
  if (registeredUser && registeredUser.password) {
    // Verify password
    if (verifyPassword(password, registeredUser.password)) {
      const jwtToken = generateJWTToken_username(registeredUser);
      const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
      res.cookie("accessToken", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
      res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false });
      // Return user data without password
      const userData = { ...registeredUser.toObject() };
      delete userData.password;
      return res.status(200).json(
        new ApiResponse(200, { user: userData }, "Login successful")
      );
    } else {
      throw new ApiError(401, "Invalid email or password");
    }
  }

  // Check if unregistered user exists
  const unregisteredUser = await UnRegisteredUser.findOne({ email });
  if (unregisteredUser && unregisteredUser.password) {
    // Verify password
    if (verifyPassword(password, unregisteredUser.password)) {
      const jwtToken = generateJWTToken_email(unregisteredUser);
      const expiryDate = new Date(Date.now() + 1 * 60 * 60 * 1000);
      res.cookie("accessTokenRegistration", jwtToken, { httpOnly: true, expires: expiryDate, secure: false });
      res.cookie("hasSession", "true", { expires: expiryDate, secure: false, httpOnly: false });
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

// Helper function to hash password using crypto (built-in Node.js module)
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

// Helper function to verify password
function verifyPassword(password, hashedPassword) {
  if (!hashedPassword) return false;
  const [salt, hash] = hashedPassword.split(":");
  const verifyHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === verifyHash;
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

  user.password = hashPassword(newPassword);
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
      password: hashPassword(password),
      otp,
      otpExpires
    });
  } else {
    // Update existing unregistered user
    unregisteredUser.name = name;
    unregisteredUser.password = hashPassword(password);
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
