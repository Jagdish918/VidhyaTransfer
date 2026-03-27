import { Router } from "express";
import { verifyJWT_username as verifyJWT } from "../middlewares/verifyJWT.middleware.js";
import {
  requestInstantHelp,
  acceptInstantHelp,
  declineInstantHelp,
  endInstantHelpSession,
} from "../controllers/session/instantHelp.controllers.js";

const router = Router();

// All routes require authentication
router.route("/request").post(verifyJWT, requestInstantHelp);
router.route("/:sessionId/accept").patch(verifyJWT, acceptInstantHelp);
router.route("/:sessionId/decline").patch(verifyJWT, declineInstantHelp);
router.route("/:sessionId/end").patch(verifyJWT, endInstantHelpSession);

export default router;
