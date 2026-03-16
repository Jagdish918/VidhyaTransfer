import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { Message } from "../../models/message.model.js";
import { Chat } from "../../models/chat.model.js";

export const sendMessage = asyncHandler(async (req, res) => {
  console.log("\n******** Inside sendMessage Controller function ********");

  const { chatId, content, replyTo } = req.body;

  if (!chatId || !content) {
    throw new ApiError(400, "Please provide all the details");
  }

  // Enforce message length limit
  if (content.length > 5000) {
    throw new ApiError(400, "Message content too long (max 5000 characters)");
  }

  const sender = req.user._id;

  // Single query — verify sender is a participant in this chat
  const chat = await Chat.findOne({ _id: chatId, users: sender });
  if (!chat) {
    throw new ApiError(403, "You are not a participant in this chat");
  }

  var message = await Message.create({
    chatId: chatId,
    sender: sender,
    content: content,
    replyTo: replyTo || null,
  });

  message = await message.populate("sender", "username name email picture");
  message = await message.populate("chatId");
  message = await message.populate({
    path: "replyTo",
    populate: { path: "sender", select: "name" },
  });

  message = await User.populate(message, {
    path: "chatId.users",
    select: "username name email picture",
  });

  await Chat.findByIdAndUpdate(
    { _id: chatId },
    { latestMessage: message }
  );

  return res.status(201).json(new ApiResponse(201, message, "Message sent successfully"));
});

export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = 50; // 50 messages per page

  // ✅ SECURITY: Verify the requesting user is a participant of this chat
  const chat = await Chat.findOne({ _id: chatId, users: userId });
  if (!chat) {
    throw new ApiError(403, "You do not have access to this chat");
  }

  const total = await Message.countDocuments({ chatId });

  // ✅ FIX: Paginate — return newest messages first, then reverse for display order
  const messages = await Message.find({ chatId })
    .populate("sender", "username name email picture chatId")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name" },
    })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return res.status(200).json(new ApiResponse(200, {
    messages: messages.reverse(),
    pagination: { page, pages: Math.ceil(total / limit), total, hasMore: (page * limit) < total },
  }, "Messages fetched successfully"));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  // Soft delete — replace content
  message.deleted = true;
  message.content = "This message was deleted";
  await message.save();

  return res.status(200).json(new ApiResponse(200, message, "Message deleted"));
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  if (!emoji) throw new ApiError(400, "Emoji is required");

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  // ✅ Verify the reacting user is a participant of the chat
  const chat = await Chat.findOne({ _id: message.chatId, users: userId });
  if (!chat) throw new ApiError(403, "You do not have access to this chat");

  // Toggle: if same user already reacted with same emoji, remove it
  const existingIdx = message.reactions.findIndex(
    (r) => r.userId.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingIdx !== -1) {
    message.reactions.splice(existingIdx, 1);
  } else {
    // Remove any other reaction from this user first (one reaction per user)
    message.reactions = message.reactions.filter(
      (r) => r.userId.toString() !== userId.toString()
    );
    message.reactions.push({ emoji, userId });
  }

  await message.save();
  await message.populate("reactions.userId", "name");

  return res.status(200).json(new ApiResponse(200, message, "Reaction updated"));
});
