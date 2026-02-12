import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/event.model.js";
import { User } from "../../models/user.model.js";

// @desc    Create a new event
// @route   POST /api/v1/events
// @access  Admin
export const createEvent = asyncHandler(async (req, res) => {
    const { title, description, date, link, image } = req.body;

    if (!title || !description || !date) {
        throw new ApiError(400, "Title, description and date are required");
    }

    // Ensure user is admin (Middleware should handle this, but double check)
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can create events");
    }

    const event = await Event.create({
        title,
        description,
        date,
        link,
        image,
        createdBy: req.user._id,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, event, "Event created successfully"));
});

// @desc    Get all upcoming events
// @route   GET /api/v1/events
// @access  Public/User
export const getEvents = asyncHandler(async (req, res) => {
    const events = await Event.find({
        date: { $gte: new Date() } // Only upcoming events by default
    }).sort({ date: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, events, "Events fetched successfully"));
});


// @desc    Get all events (Admin view - inc past)
// @route   GET /api/v1/events/admin
// @access  Admin
export const getAllEventsAdmin = asyncHandler(async (req, res) => {
    const events = await Event.find({}).sort({ date: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, events, "All events fetched successfully"));
});

// @desc    Delete event
// @route   DELETE /api/v1/events/:id
// @access  Admin
export const deleteEvent = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    await Event.findByIdAndDelete(req.params.id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Event deleted successfully"));
});
