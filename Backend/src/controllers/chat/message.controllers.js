import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { UnRegisteredUser } from "../../models/unRegisteredUser.model.js";
import { generateJWTToken_username } from "../../utils/generateJWTToken.js";
import { Message } from "../../models/message.model.js";
import { Chat } from "../../models/chat.model.js";

export const sendMessage = asyncHandler(async (req, res) => {
  console.log("\n******** Inside sendMessage Controller function ********");

  const { chatId, content, replyTo } = req.body;

  if (!chatId || !content) {
    throw new ApiError(400, "Please provide all the details");
  }

  const sender = req.user._id;

  const check = await Chat.findOne({ _id: chatId });

  if (!check.users.includes(sender)) {
    throw new ApiError(400, "Chat is not approved");
  }

  const chat = await Chat.findById(chatId);
  if (!chat) {
    throw new ApiError(400, "Chat not found");
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
  console.log("\n******** Inside getMessages Controller function ********");

  const chatId = req.params.chatId;

  const messages = await Message.find({ chatId: chatId })
    .populate("sender", "username name email picture chatId")
    .populate({
      path: "replyTo",
      populate: { path: "sender", select: "name" },
    });

  return res.status(200).json(new ApiResponse(200, messages, "Messages fetched successfully"));
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  if (message.sender.toString() !== userId.toString()) {
    throw new ApiError(403, "You can only delete your own messages");
  }

  // Soft delete – replace content
  message.deleted = true;
  message.content = "This message was deleted";
  await message.save();

  return res.status(200).json(new ApiResponse(200, message, "Message deleted"));
});

export const reactToMessage = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.user._id;

  const message = await Message.findById(messageId);
  if (!message) throw new ApiError(404, "Message not found");

  // Toggle: if same user already reacted with same emoji, remove it
  const existingIdx = message.reactions.findIndex(
    r => r.userId.toString() === userId.toString() && r.emoji === emoji
  );

  if (existingIdx !== -1) {
    message.reactions.splice(existingIdx, 1);
  } else {
    // Remove any other reaction from this user first (one reaction per user)
    message.reactions = message.reactions.filter(
      r => r.userId.toString() !== userId.toString()
    );
    message.reactions.push({ emoji, userId });
  }

  await message.save();
  await message.populate("reactions.userId", "name");

  return res.status(200).json(new ApiResponse(200, message, "Reaction updated"));
});
