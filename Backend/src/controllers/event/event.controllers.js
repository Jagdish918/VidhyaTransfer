import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/event.model.js";
import { User } from "../../models/user.model.js";

// @desc    Create a new event
// @route   POST /api/v1/events
// @access  Admin
export const createEvent = asyncHandler(async (req, res) => {
    const { title, shortDescription, description, date, startTime, endTime, location, credits, maxParticipants, tags, learningOutcomes, link, image } = req.body;

    if (!title || !description || !date || !startTime || !location) {
        throw new ApiError(400, "Title, description, date, time and location are required");
    }

    // Ensure user is admin
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can create events");
    }

    const event = await Event.create({
        title,
        shortDescription,
        description,
        date,
        startTime,
        endTime,
        location,
        credits: credits || 0,
        maxParticipants: maxParticipants || 50,
        tags: tags || [],
        learningOutcomes: learningOutcomes || [],
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

// @desc    Get single event by ID
// @route   GET /api/v1/events/:id
// @access  Public/User
export const getEventById = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id).populate("createdBy", "name picture bio role");

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, event, "Event detail fetched successfully"));
});

// @desc    Register for an event
// @route   POST /api/v1/events/:id/register
// @access  User
export const registerForEvent = asyncHandler(async (req, res) => {
    const session = await Event.startSession();
    session.startTransaction();

    try {
        const event = await Event.findById(req.params.id).session(session);
        const user = await User.findById(req.user._id).session(session);

        if (!event) {
            throw new ApiError(404, "Event not found");
        }

        // Check if already registered
        if (event.participants.includes(user._id)) {
            throw new ApiError(400, "You are already registered for this event");
        }

        // Check availability
        if (event.participants.length >= event.maxParticipants) {
            throw new ApiError(400, "Event is full");
        }

        // Check credits if event has a cost
        if (event.credits > 0) {
            if (user.credits < event.credits) {
                throw new ApiError(400, `Insufficient credits. You need ${event.credits} credits to register.`);
            }

            // Deduct credits
            user.credits -= event.credits;
            await user.save({ session });
        }

        // Add user to participants
        event.participants.push(user._id);
        await event.save({ session });

        await session.commitTransaction();
        session.endSession();

        return res
            .status(200)
            .json(new ApiResponse(200, { event, remainingCredits: user.credits }, "Registered successfully"));
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
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

// @desc    Update event
// @route   PUT /api/v1/events/:id
// @access  Admin
export const updateEvent = asyncHandler(async (req, res) => {
    const { title, shortDescription, description, date, startTime, endTime, location, credits, maxParticipants, tags, learningOutcomes, link, image } = req.body;

    let event = await Event.findById(req.params.id);

    if (!event) {
        throw new ApiError(404, "Event not found");
    }

    // Ensure user is admin (though middleware handles this)
    if (req.user.role !== "admin") {
        throw new ApiError(403, "Only admins can update events");
    }

    event = await Event.findByIdAndUpdate(
        req.params.id,
        {
            title,
            shortDescription,
            description,
            date,
            startTime,
            endTime,
            location,
            credits: credits || 0,
            maxParticipants: maxParticipants || 50,
            tags: tags || [],
            learningOutcomes: learningOutcomes || [],
            link,
            image,
        },
        { new: true, runValidators: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, event, "Event updated successfully"));
});
