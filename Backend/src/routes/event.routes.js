import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { emailLimiter } from "../middlewares/rateLimiter.middleware.js";
import { createEvent, getEvents, deleteEvent, getAllEventsAdmin, getEventById, registerForEvent, updateEvent, scheduleMeeting, getMyEvents } from "../controllers/event/event.controllers.js";

const router = Router();

// Protect all routes with JWT verification
router.use(verifyJWT_username);

// New Schedule Meeting route — emailLimiter: 5/hr prevents email spam (sends 2 emails per call)
router.route("/schedule").post(emailLimiter, scheduleMeeting);

// Getting events is open to all logged in users
// Creating events is restricted to admins
router.route("/")
    .get(getEvents)
    .post(verifyAdmin, createEvent);

// Admin specific routes
router.route("/all").get(verifyAdmin, getAllEventsAdmin);

// ✅ FIX: /user/my-events MUST be declared BEFORE /:id
// Otherwise Express matches "user" as the :id param and throws a 500 (invalid ObjectId)
router.route("/user/my-events").get(getMyEvents);

router.route("/:id")
    .get(getEventById)
    .delete(verifyAdmin, deleteEvent)
    .put(verifyAdmin, updateEvent);

router.route("/:id/register").post(registerForEvent);

export default router;
