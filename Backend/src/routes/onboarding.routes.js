import { Router } from "express";
import { verifyJWT_any } from "../middlewares/verifyJWT.middleware.js";
import {
  updatePersonalInfo,
  updateSkillProfile,
  updatePreferences,
  getOnboardingStatus,
} from "../controllers/onboarding/onboarding.controllers.js";

const router = Router();

// Unified onboarding routes for both registered and unregistered users
router.route("/personal-info").post(verifyJWT_any, updatePersonalInfo);
router.route("/skill-profile").post(verifyJWT_any, updateSkillProfile);
router.route("/preferences").post(verifyJWT_any, updatePreferences);
router.route("/status").get(verifyJWT_any, getOnboardingStatus);

export default router;


