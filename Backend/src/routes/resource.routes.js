import { Router } from "express";
import {
    generateUnifiedRoadmap,
    generateSubtopicNote,
    updateSubtopicProgress,
    completeWholeTopic,
    generateFinalTest,
    submitFinalTest,
    getSavedResources
} from "../controllers/resource.controller.js";
import { verifyJWT_any } from "../middlewares/verifyJWT.middleware.js";

const router = Router();

router.use(verifyJWT_any);

router.post("/generate-roadmap", generateUnifiedRoadmap);
router.post("/generate-subtopic-note", generateSubtopicNote);
router.put("/update-progress", updateSubtopicProgress);
router.put("/complete-topic", completeWholeTopic);
router.post("/generate-final-test", generateFinalTest);
router.post("/submit-final-test", submitFinalTest);
router.get("/saved", getSavedResources);

export default router;
