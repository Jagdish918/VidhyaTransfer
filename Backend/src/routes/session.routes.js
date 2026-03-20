import { Router } from "express";
import { verifyJWT_username as verifyJWT } from "../middlewares/verifyJWT.middleware.js";
import {
  bookSession,
  acceptSession,
  declineSession,
  completeSession,
  cancelSession,
  getMySessions,
  getSessionById,
} from "../controllers/session/session.controllers.js";

const router = Router();

// All routes require authentication
router.route("/book").post(verifyJWT, bookSession);
router.route("/my").get(verifyJWT, getMySessions);
router.route("/:sessionId").get(verifyJWT, getSessionById);
router.route("/:sessionId/accept").patch(verifyJWT, acceptSession);
router.route("/:sessionId/decline").patch(verifyJWT, declineSession);
router.route("/:sessionId/complete").patch(verifyJWT, completeSession);
router.route("/:sessionId/cancel").patch(verifyJWT, cancelSession);

export default router;
