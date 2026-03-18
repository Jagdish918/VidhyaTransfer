import { Router } from "express";
import { getDailyQuiz, submitDailyQuiz } from "../controllers/quiz.controller.js";
import { verifyJWT_any } from "../middlewares/verifyJWT.middleware.js";

const router = Router();

router.use(verifyJWT_any);

router.get("/daily", getDailyQuiz);
router.post("/daily", submitDailyQuiz);

export default router;
