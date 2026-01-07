import { Router } from "express";
import { verifyJWT_email, verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import {
  updatePersonalInfo,
  updateSkillProfile,
  updatePreferences,
  getOnboardingStatus,
} from "../controllers/onboarding.controllers.js";

const router = Router();

// Unregistered users
router.route("/personal-info").post(verifyJWT_email, updatePersonalInfo);
router.route("/skill-profile").post(verifyJWT_email, updateSkillProfile);
router.route("/preferences").post(verifyJWT_email, updatePreferences);
router.route("/status").get(verifyJWT_email, getOnboardingStatus);

// Registered users
router.route("/registered/personal-info").post(verifyJWT_username, updatePersonalInfo);
router.route("/registered/skill-profile").post(verifyJWT_username, updateSkillProfile);
router.route("/registered/preferences").post(verifyJWT_username, updatePreferences);
router.route("/registered/status").get(verifyJWT_username, getOnboardingStatus);

export default router;


