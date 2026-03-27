import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { Session } from "../../models/session.model.js";
import { InstantHelpMessage } from "../../models/instantHelpMessage.model.js";

export const sendInstantHelpMessage = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { content } = req.body;
  const senderId = req.user._id;

  if (!content) {
    throw new ApiError(400, "Message content is required");
  }

  // Enforce message length limit
  if (content.length > 5000) {
    throw new ApiError(400, "Message content too long (max 5000 characters)");
  }

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  // Verify sender is part of the session
  if (session.learner.toString() !== senderId.toString() && session.mentor.toString() !== senderId.toString()) {
    throw new ApiError(403, "You are not a participant in this session");
  }

  // Only allow messages while session is active
  if (session.status !== "in_progress") {
    throw new ApiError(400, "Cannot send messages. This session is " + session.status);
  }

  let message = await InstantHelpMessage.create({
    sessionId,
    sender: senderId,
    content,
  });

  message = await message.populate("sender", "username name email picture");

  // Emit real-time socket event from the server
  const io = req.app.get("io");
  if (io) {
    // Determine the partner to send the message to
    const targetUserId = session.learner.toString() === senderId.toString() 
      ? session.mentor.toString() 
      : session.learner.toString();
      
    io.to(targetUserId).emit("instantHelpMessage", message);
  }

  return res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
});

export const getInstantHelpMessages = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = 50;

  const session = await Session.findById(sessionId);
  if (!session) {
    throw new ApiError(404, "Session not found");
  }

  // Verify user is part of the session
  if (session.learner.toString() !== userId.toString() && session.mentor.toString() !== userId.toString()) {
    throw new ApiError(403, "You do not have access to this session's messages");
  }

  const total = await InstantHelpMessage.countDocuments({ sessionId });

  const messages = await InstantHelpMessage.find({ sessionId })
    .populate("sender", "username name email picture")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return res.status(200).json(new ApiResponse(200, {
    messages: Object.assign([], messages).reverse(),
    pagination: { page, pages: Math.ceil(total / limit), total, hasMore: (page * limit) < total },
  }, "Messages fetched successfully"));
});
