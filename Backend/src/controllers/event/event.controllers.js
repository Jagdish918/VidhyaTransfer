import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { Event } from "../../models/event.model.js";
import { User } from "../../models/user.model.js";
import { Chat } from "../../models/chat.model.js";
import { sendMail } from "../../utils/SendMail.js";

// @desc    Schedule a private meeting and send email notifications
// @route   POST /api/v1/events/schedule
// @access  User
export const scheduleMeeting = asyncHandler(async (req, res) => {
    const { chatId, title, date, time, type, link } = req.body;

    if (!chatId || !title || !date || !time) {
        throw new ApiError(400, "All fields (chatId, title, date, time) are required");
    }

    // ✅ FIX: Verify the requester is actually a participant in this chat (prevents email spam to strangers)
    const chat = await Chat.findOne({ _id: chatId, users: req.user._id }).populate("users", "email name");
    if (!chat) {
        throw new ApiError(403, "You are not a participant in this chat");
    }

    const meetingLink = type === 'internal' ? 'Internal Video Call' : link;
    const sender = chat.users.find(u => u._id.toString() === req.user._id.toString());
    const recipient = chat.users.find(u => u._id.toString() !== req.user._id.toString());

    if (!sender || !recipient) {
        throw new ApiError(400, "Participants not found in this chat context");
    }

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const emailTemplate = (userName) => `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; padding: 40px; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <div style="background-color: #1a73e8; padding: 30px; text-align: center;">
                    <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Meeting Invitation</h1>
                </div>
                <div style="padding: 40px;">
                    <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
                    <p style="font-size: 16px; line-height: 1.6;">A new meeting has been scheduled on <strong>Peer Swap</strong>.</p>
                    
                    <div style="background-color: #f8f9fa; border-left: 4px solid #1a73e8; padding: 20px; margin: 30px 0; border-radius: 4px;">
                        <p style="margin: 0 0 10px 0;"><strong>📌 Topic:</strong> ${title}</p>
                        <p style="margin: 0 0 10px 0;"><strong>🗓 Date:</strong> ${formattedDate}</p>
                        <p style="margin: 0 0 10px 0;"><strong>⏰ Time:</strong> ${time}</p>
                        <p style="margin: 0;"><strong>🔗 Link:</strong> <a href="${type === 'internal' ? '#' : link}" style="color: #1a73e8; text-decoration: none;">${meetingLink}</a></p>
                    </div>

                    <p style="font-size: 14px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                        This is an automated notification from Peer Swap. Please coordinate in the chat for further details.
                    </p>
                </div>
            </div>
        </div>
    `;

    // Send to recipient
    await sendMail(recipient.email, `Meeting Invitation: ${title}`, emailTemplate(recipient.name));

    // Send confirmation to sender
    await sendMail(sender.email, `Meeting Confirmed: ${title}`, emailTemplate(sender.name));

    return res
        .status(200)
        .json(new ApiResponse(200, { success: true }, "Meeting scheduled and invitation emails sent"));
});

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
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // ✅ FIX: add pagination, cap at 100
    const skip = (page - 1) * limit;

    const query = { date: { $gte: new Date() } }; // Only upcoming events
    const total = await Event.countDocuments(query);

    const events = await Event.find(query)
        .sort({ date: 1 })
        .skip(skip)
        .limit(limit);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            events,
            pagination: { page, pages: Math.ceil(total / limit), total },
        }, "Events fetched successfully"));
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

// @desc    Get events registered by current user
// @route   GET /api/v1/events/my-events
// @access  User
export const getMyEvents = asyncHandler(async (req, res) => {
    const events = await Event.find({
        participants: req.user._id
    }).sort({ date: 1 });

    return res
        .status(200)
        .json(new ApiResponse(200, events, "Your registered events fetched successfully"));
});

