import jwt from "jsonwebtoken";

/**
 * Generates a JWT for unregistered (email-stage) users.
 * Does NOT include tokenVersion — these tokens are short-lived (30 min)
 * and only used during the onboarding flow.
 */
const generateJWTToken_email = (user) => {
  const payload = {
    id: user._id,
    email: user.email,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

/**
 * Generates a JWT for fully registered users.
 * Includes tokenVersion — allows instant revocation by incrementing
 * the user's tokenVersion in the database (ban, logout, password reset).
 */
const generateJWTToken_username = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    // ✅ JWT REVOCATION: Embed the current tokenVersion in the token.
    // If the DB version is ever incremented (ban/logout/password change),
    // this token becomes invalid immediately — no need to wait for expiry.
    tokenVersion: user.tokenVersion ?? 0,
  };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1h" });
};

export { generateJWTToken_email, generateJWTToken_username };
