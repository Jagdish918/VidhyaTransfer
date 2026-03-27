import { Router } from "express";
import { verifyJWT_username as verifyJWT } from "../middlewares/verifyJWT.middleware.js";
import {
  requestInstantHelp,
  acceptInstantHelp,
  declineInstantHelp,
  endInstantHelpSession,
  getMyInstantHelpSessions,
  startInstantHelpMeeting,
} from "../controllers/session/instantHelp.controllers.js";
import {
  getInstantHelpMessages,
  sendInstantHelpMessage,
} from "../controllers/session/instantHelpChat.controllers.js";

const router = Router();

// All routes require authentication
router.route("/request").post(verifyJWT, requestInstantHelp);
router.route("/sessions").get(verifyJWT, getMyInstantHelpSessions);
router.route("/:sessionId/accept").patch(verifyJWT, acceptInstantHelp);
router.route("/:sessionId/decline").patch(verifyJWT, declineInstantHelp);
router.route("/:sessionId/end").patch(verifyJWT, endInstantHelpSession);
router.route("/:sessionId/meeting/start").post(verifyJWT, startInstantHelpMeeting);
router.route("/:sessionId/messages").get(verifyJWT, getInstantHelpMessages);
router.route("/:sessionId/messages").post(verifyJWT, sendInstantHelpMessage);

export default router;