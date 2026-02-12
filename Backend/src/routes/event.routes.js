import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { createEvent, getEvents, deleteEvent, getAllEventsAdmin } from "../controllers/event/event.controllers.js";

const router = Router();

// Protect all routes with JWT verification
router.use(verifyJWT_username);

// Getting events is open to all logged in users
// Creating events is restricted to admins
router.route("/")
    .get(getEvents)
    .post(verifyAdmin, createEvent);

// Admin specific routes
router.route("/all").get(verifyAdmin, getAllEventsAdmin);

router.route("/:id").delete(verifyAdmin, deleteEvent);

export default router;
