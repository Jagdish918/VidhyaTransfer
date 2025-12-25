import { generateJWTToken_email, generateJWTToken_username } from "../utils/generateJWTToken.js";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { User } from "../models/user.model.js";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";

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
    return res.redirect(`http://localhost:5173/`);
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
  return res.redirect("http://localhost:5173/");
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
  return res.status(200).json(new ApiResponse(200, null, "User logged out successfully"));
};
