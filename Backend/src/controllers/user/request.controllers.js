import { ApiResponse } from "../../utils/ApiResponse.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { User } from "../../models/user.model.js";
import { Request } from "../../models/request.model.js";
import { Chat } from "../../models/chat.model.js";
import { sendMail } from "../../utils/SendMail.js";

// ─── EMAIL TEMPLATES ──────────────────────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const emailTemplates = {
  // Sent to the RECEIVER when someone sends them a connection request
  requestReceived: (senderName, senderPicture, senderUsername, receiverName) => ({
    subject: `🤝 ${senderName} wants to connect with you on VidhyaTransfer`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0fdf4; padding: 40px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <div style="background: linear-gradient(135deg, #065f46, #10b981); padding: 36px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
              New Connection Request
            </h1>
            <p style="color: #a7f3d0; margin: 8px 0 0; font-size: 14px;">Someone wants to connect with you</p>
          </div>

          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Hi <strong>${receiverName}</strong>,</p>

            <div style="display: flex; align-items: center; gap: 16px; background: #f9fafb; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #e5e7eb;">
              <img 
                src="${senderPicture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ'}" 
                alt="${senderName}" 
                style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 3px solid #10b981;"
              />
              <div>
                <div style="font-size: 17px; font-weight: 700; color: #111827;">${senderName}</div>
                <div style="font-size: 13px; color: #6b7280;">@${senderUsername}</div>
              </div>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
              <strong>${senderName}</strong> would like to connect with you on VidhyaTransfer.
              Accept or decline the request from your profile.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a 
                href="${FRONTEND_URL}/notifications" 
                style="display: inline-block; background: linear-gradient(135deg, #065f46, #10b981); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;"
              >
                View Request →
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin: 0; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center;">
              This is an automated notification from VidhyaTransfer. If you don't know this person, you can ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  // Sent to the original SENDER when their request is accepted
  requestAccepted: (acceptorName, acceptorPicture, acceptorUsername, senderName) => ({
    subject: `🎉 ${acceptorName} accepted your connection request!`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f0fdf4; padding: 40px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <div style="background: linear-gradient(135deg, #065f46, #10b981); padding: 36px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 8px;">🎉</div>
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
              You're now connected!
            </h1>
          </div>

          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">Hi <strong>${senderName}</strong>,</p>

            <div style="display: flex; align-items: center; gap: 16px; background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 28px; border: 1px solid #6ee7b7;">
              <img 
                src="${acceptorPicture || 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToK4qEfbnd-RN82wdL2awn_PMviy_pelocqQ'}" 
                alt="${acceptorName}" 
                style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; border: 3px solid #10b981;"
              />
              <div>
                <div style="font-size: 17px; font-weight: 700; color: #111827;">${acceptorName}</div>
                <div style="font-size: 13px; color: #6b7280;">@${acceptorUsername}</div>
                <div style="font-size: 12px; color: #10b981; font-weight: 600; margin-top: 4px;">✓ Now Connected</div>
              </div>
            </div>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
              Great news! <strong>${acceptorName}</strong> accepted your connection request.
              You can now chat with them directly on VidhyaTransfer.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a 
                href="${FRONTEND_URL}/chat" 
                style="display: inline-block; background: linear-gradient(135deg, #065f46, #10b981); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px;"
              >
                Start Chatting →
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin: 0; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center;">
              Automated notification from VidhyaTransfer
            </p>
          </div>
        </div>
      </div>
    `,
  }),

  // Sent to the original SENDER when their request is rejected
  requestRejected: (rejectorName, senderName) => ({
    subject: `Connection request to ${rejectorName} was declined`,
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f9fafb; padding: 40px;">
        <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <div style="background: linear-gradient(135deg, #374151, #6b7280); padding: 36px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">
              Connection Request Update
            </h1>
          </div>

          <div style="padding: 40px;">
            <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">Hi <strong>${senderName}</strong>,</p>

            <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 28px;">
              <strong>${rejectorName}</strong> has declined your connection request. 
              Don't be discouraged — you can discover other users who are interested in your skills.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a 
                href="${FRONTEND_URL}/discover" 
                style="display: inline-block; background: linear-gradient(135deg, #374151, #6b7280); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 15px;"
              >
                Discover People →
              </a>
            </div>

            <p style="color: #9ca3af; font-size: 12px; margin: 0; padding-top: 20px; border-top: 1px solid #f3f4f6; text-align: center;">
              Automated notification from VidhyaTransfer
            </p>
          </div>
        </div>
      </div>
    `,
  }),
};

// ─── SEND REQUEST ─────────────────────────────────────────────────────────────
export const createRequest = asyncHandler(async (req, res, next) => {
  const { receiverID } = req.body;
  const senderID = req.user._id;

  if (!receiverID) {
    throw new ApiError(400, "Receiver ID is required");
  }

  // Prevent self-request
  if (receiverID.toString() === senderID.toString()) {
    throw new ApiError(400, "You cannot send a connection request to yourself");
  }

  // Look for any existing request between these two users (in either direction)
  const existingRequest = await Request.findOne({
    $or: [
      { sender: senderID, receiver: receiverID },
      { sender: receiverID, receiver: senderID },
    ],
  });

  if (existingRequest) {
    const { status, updatedAt } = existingRequest;

    // Case 1: Already pending — don't allow duplicate
    if (status === "Pending") {
      throw new ApiError(400, "A connection request is already pending between you two");
    }

    // Case 2: Already connected — don't allow a new request
    if (status === "Connected") {
      throw new ApiError(400, "You are already connected with this user");
    }

    // Case 3: Previously rejected — allow resend after 10-second cooldown
    if (status === "Rejected") {
      const secondsSinceRejection = (Date.now() - new Date(updatedAt).getTime()) / 1000;
      const COOLDOWN_SECONDS = 10;

      if (secondsSinceRejection < COOLDOWN_SECONDS) {
        const secsLeft = Math.ceil(COOLDOWN_SECONDS - secondsSinceRejection);
        throw new ApiError(
          429,
          `This request was declined. You can send another request in ${secsLeft} second${secsLeft === 1 ? "" : "s"}.`
        );
      }

      // Cooldown passed — delete the old rejected record and allow a fresh request
      await Request.findByIdAndDelete(existingRequest._id);
    }
  }

  const connectionRequest = await Request.create({
    sender: senderID,
    receiver: receiverID,
  });

  if (!connectionRequest) return next(new ApiError(500, "Request not created"));

  // ✅ Send email notification to receiver (non-blocking)
  try {
    const receiver = await User.findById(receiverID).select("email name");
    if (receiver?.email) {
      const { subject, html } = emailTemplates.requestReceived(
        req.user.name,
        req.user.picture,
        req.user.username,
        receiver.name
      );
      sendMail(receiver.email, subject, html);
    }
  } catch (_) {
    // Email failure should never block the request from being created
  }

  res.status(201).json(new ApiResponse(201, connectionRequest, "Request sent successfully"));
});

// ─── GET RECEIVED REQUESTS ────────────────────────────────────────────────────
export const getRequests = asyncHandler(async (req, res, next) => {
  const receiverID = req.user._id;

  const requests = await Request.find({ receiver: receiverID, status: "Pending" }).populate("sender");

  if (requests.length > 0) {
    const sendersDetails = requests.map((request) => request._doc.sender);
    return res.status(200).json(new ApiResponse(200, sendersDetails, "Requests fetched successfully"));
  }

  return res.status(200).json(new ApiResponse(200, requests, "Requests fetched successfully"));
});

// ─── ACCEPT REQUEST ───────────────────────────────────────────────────────────
export const acceptRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.body; // requestId = the original sender's _id
  const acceptorId = req.user._id;

  const existingRequest = await Request.findOne({ sender: requestId, receiver: acceptorId });

  if (!existingRequest) {
    throw new ApiError(400, "Request does not exist");
  }

  const existingChat = await Chat.findOne({ users: { $all: [requestId, acceptorId] } });

  if (existingChat) {
    throw new ApiError(400, "Chat already exists");
  }

  // Create the chat
  const chat = await Chat.create({ users: [requestId, acceptorId] });
  if (!chat) return next(new ApiError(500, "Chat not created"));

  // Update request status
  await Request.findOneAndUpdate(
    { sender: requestId, receiver: acceptorId },
    { status: "Connected" }
  );

  // ✅ Send acceptance email to the original sender (non-blocking)
  try {
    const originalSender = await User.findById(requestId).select("email name");
    if (originalSender?.email) {
      const { subject, html } = emailTemplates.requestAccepted(
        req.user.name,
        req.user.picture,
        req.user.username,
        originalSender.name
      );
      sendMail(originalSender.email, subject, html);
    }
  } catch (_) {
    // Email failure should not break the accept flow
  }

  res.status(201).json(new ApiResponse(201, chat, "Request accepted successfully"));
});

// ─── REJECT REQUEST ───────────────────────────────────────────────────────────
export const rejectRequest = asyncHandler(async (req, res, next) => {
  const { requestId } = req.body; // requestId = the original sender's _id
  const rejectorId = req.user._id;

  const existingRequest = await Request.findOne({
    sender: requestId,
    receiver: rejectorId,
    status: "Pending",
  });

  if (!existingRequest) {
    throw new ApiError(400, "Request does not exist");
  }

  await Request.findOneAndUpdate(
    { sender: requestId, receiver: rejectorId },
    { status: "Rejected" }
  );

  // ✅ Send rejection email to the original sender (non-blocking)
  try {
    const originalSender = await User.findById(requestId).select("email name");
    if (originalSender?.email) {
      const { subject, html } = emailTemplates.requestRejected(
        req.user.name,
        originalSender.name
      );
      sendMail(originalSender.email, subject, html);
    }
  } catch (_) {
    // Email failure should not block the rejection
  }

  res.status(200).json(new ApiResponse(200, null, "Request rejected successfully"));
});

// ─── GET SENT REQUESTS ────────────────────────────────────────────────────────
export const getSentRequests = asyncHandler(async (req, res, next) => {
  const senderID = req.user._id;
  const requests = await Request.find({ sender: senderID, status: "Pending" });
  return res.status(200).json(new ApiResponse(200, requests, "Sent requests fetched successfully"));
});

// ─── CANCEL REQUEST ───────────────────────────────────────────────────────────
export const cancelRequest = asyncHandler(async (req, res, next) => {
  const { receiverID } = req.body;
  const senderID = req.user._id;

  const deletedRequest = await Request.findOneAndDelete({
    sender: senderID,
    receiver: receiverID,
    status: "Pending",
  });

  if (!deletedRequest) {
    throw new ApiError(404, "Pending request not found to cancel");
  }

  res.status(200).json(new ApiResponse(200, null, "Request cancelled successfully"));
});

// ─── DISCONNECT USER ──────────────────────────────────────────────────────────
export const disconnectUser = asyncHandler(async (req, res, next) => {
  const { targetUserId } = req.body;
  const currentUserId = req.user._id;

  if (!targetUserId) {
    throw new ApiError(400, "Target user ID is required");
  }

  // Remove the connected request in both directions
  await Request.deleteMany({
    $or: [
      { sender: currentUserId, receiver: targetUserId, status: "Connected" },
      { sender: targetUserId, receiver: currentUserId, status: "Connected" },
    ],
  });

  // Delete the shared chat and all its messages
  const { Message } = await import("../../models/message.model.js");
  const chat = await Chat.findOne({ users: { $all: [currentUserId, targetUserId] } });
  if (chat) {
    await Message.deleteMany({ chatId: chat._id });
    await Chat.findByIdAndDelete(chat._id);
  }

  res.status(200).json(new ApiResponse(200, null, "Disconnected successfully"));
});
