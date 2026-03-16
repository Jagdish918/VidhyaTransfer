import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UnRegisteredUser } from "../models/unRegisteredUser.model.js";
dotenv.config();

// ─── EMAIL-STAGE TOKEN VERIFICATION ──────────────────────────────────────────
// Used during onboarding — verifies unregistered users only.
const verifyJWT_email = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessTokenRegistration ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Please Login");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await UnRegisteredUser.findOne({
      email: decodedToken?.email,
    }).select("-_id -__v -createdAt -updatedAt");

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Login Again, Session Expired");
    } else {
      throw new ApiError(401, error.message || "Invalid Access Token");
    }
  }
});

// ─── REGISTERED USER TOKEN VERIFICATION ─────────────────────────────────────
// Used for all authenticated routes — verifies registered users.
// Also enforces:
//   ✅ Ban check         — banned users are kicked out immediately
//   ✅ Token revocation  — tokenVersion mismatch = token was invalidated
const verifyJWT_username = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Please Login");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findOne({ username: decodedToken?.username }).select(
      "-__v -createdAt -updatedAt"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }

    // ✅ BAN CHECK: Immediately reject banned users and clear their cookies
    if (user.status === "banned") {
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("hasSession", { path: "/" });
      throw new ApiError(403, "Your account has been banned. Please contact support.");
    }

    // ✅ TOKEN REVOCATION CHECK:
    // If the token's embedded version is lower than the DB's current version,
    // the token has been invalidated (e.g., user logged out, was banned,
    // or changed their password on another device).
    const tokenVersion = decodedToken?.tokenVersion ?? 0;
    const dbVersion = user.tokenVersion ?? 0;

    if (tokenVersion !== dbVersion) {
      res.clearCookie("accessToken", { path: "/" });
      res.clearCookie("hasSession", { path: "/" });
      throw new ApiError(401, "Session expired. Please login again.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Please Login");
    } else {
      throw new ApiError(401, error.message || "Invalid Access Token");
    }
  }
});

export { verifyJWT_email, verifyJWT_username };
