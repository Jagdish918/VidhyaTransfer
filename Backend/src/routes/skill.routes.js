import { Router } from "express";
import { verifyJWT_email, verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import {
  addCurrentSkill,
  updateSkillProficiency,
  removeCurrentSkill,
  addDesiredSkill,
  removeDesiredSkill,
} from "../controllers/user/skill.controllers.js";

const router = Router();

// Unregistered users
router.route("/current").post(verifyJWT_email, addCurrentSkill);
router.route("/current/:skillId").put(verifyJWT_email, updateSkillProficiency);
router.route("/current/:skillId").delete(verifyJWT_email, removeCurrentSkill);
router.route("/desired").post(verifyJWT_email, addDesiredSkill);
router.route("/desired/:skillId").delete(verifyJWT_email, removeDesiredSkill);

// Registered users
router.route("/registered/current").post(verifyJWT_username, addCurrentSkill);
router.route("/registered/current/:skillId").put(verifyJWT_username, updateSkillProficiency);
router.route("/registered/current/:skillId").delete(verifyJWT_username, removeCurrentSkill);
router.route("/registered/desired").post(verifyJWT_username, addDesiredSkill);
router.route("/registered/desired/:skillId").delete(verifyJWT_username, removeDesiredSkill);

export default router;


