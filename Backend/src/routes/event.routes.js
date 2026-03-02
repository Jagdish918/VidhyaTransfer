import { Router } from "express";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { verifyAdmin } from "../middlewares/admin.middleware.js";
import { createEvent, getEvents, deleteEvent, getAllEventsAdmin, getEventById, registerForEvent, updateEvent, scheduleMeeting, getMyEvents } from "../controllers/event/event.controllers.js";

const router = Router();

// Protect all routes with JWT verification
router.use(verifyJWT_username);

// New Schedule Meeting route (Private Chat Context)
router.route("/schedule").post(scheduleMeeting);

// Getting events is open to all logged in users
// Creating events is restricted to admins
router.route("/")
    .get(getEvents)
    .post(verifyAdmin, createEvent);

// Admin specific routes
router.route("/all").get(verifyAdmin, getAllEventsAdmin);

router.route("/:id")
    .get(getEventById)
    .delete(verifyAdmin, deleteEvent)
    .put(verifyAdmin, updateEvent);

router.route("/:id/register").post(registerForEvent);
router.route("/user/my-events").get(getMyEvents);

export default router;
