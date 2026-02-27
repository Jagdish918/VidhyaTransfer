import { Router } from "express";
import { generateNote, generateRoadmap, getSavedResources } from "../controllers/resource.controller.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";

const router = Router();

router.use(verifyJWT_username);

router.post("/generate-note", generateNote);
router.post("/generate-roadmap", generateRoadmap);
router.get("/saved", getSavedResources);

export default router;
