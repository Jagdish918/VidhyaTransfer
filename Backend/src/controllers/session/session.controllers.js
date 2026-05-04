import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Session } from "../../models/session.model.js";
import { Transaction } from "../../models/transaction.model.js";
import { Request } from "../../models/request.model.js";
import { sendMail } from "../../utils/SendMail.js";

// ─── BOOK SESSION (Learner books a mentor) ────────────────────────────────────
export const bookSession = asyncHandler(async (req, res) => {
  const learnerId = req.user._id;
  const { mentorId, skill, duration, scheduledAt, message } = req.body;

  if (!mentorId || !skill || !scheduledAt) {
    throw new ApiError(400, "Mentor, skill, and scheduled time are required");
  }

  if (learnerId.toString() === mentorId.toString()) {
    throw new ApiError(400, "You cannot book a session with yourself");
  }

  const mentor = await User.findById(mentorId);
  if (!mentor) throw new ApiError(404, "Mentor not found");

  // Check that learner and mentor are connected
  const connection = await Request.findOne({
    $or: [
      { sender: learnerId, receiver: mentorId },
      { sender: mentorId, receiver: learnerId },
    ],
    status: "Connected",
  });
  if (!connection) {
    throw new ApiError(403, "You must be connected with this mentor before booking a session");
  }

  const ratePerHour = mentor.preferences?.rates?.mentorship || 0;
  if (ratePerHour <= 0) {
    throw new ApiError(400, "This mentor has not set a mentorship rate");
  }

  // Calculate credits based on duration (default 60 min)
  const sessionDuration = duration || 60;
  const creditsRequired = Math.ceil((ratePerHour / 60) * sessionDuration);

  const learner = await User.findById(learnerId);
  if (!learner) throw new ApiError(404, "User not found");

  if (learner.credits < creditsRequired) {
    throw new ApiError(400, `Insufficient credits. You need ${creditsRequired} credits but have ${learner.credits}.`);
  }

  // Check for scheduling conflicts (same mentor, overlapping time)
  const scheduledDate = new Date(scheduledAt);
  const sessionEnd = new Date(scheduledDate.getTime() + sessionDuration * 60000);

  const conflict = await Session.findOne({
    mentor: mentorId,
    status: { $in: ["pending", "accepted"] },
    scheduledAt: {
      $gte: new Date(scheduledDate.getTime() - sessionDuration * 60000),
      $lte: sessionEnd,
    },
  });

  if (conflict) {
    throw new ApiError(409, "This mentor already has a session scheduled around this time");
  }

  // --- Use a MongoDB transaction for atomicity ---
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Deduct credits from learner (escrow)
    learner.credits -= creditsRequired;
    await learner.save({ session: dbSession });

    // Create the session booking
    const [newSession] = await Session.create(
      [
        {
          learner: learnerId,
          mentor: mentorId,
          skill,
          creditsEscrowed: creditsRequired,
          ratePerHour,
          duration: sessionDuration,
          scheduledAt: scheduledDate,
          message: message || "",
          status: "pending",
        },
      ],
      { session: dbSession }
    );

    // Log the escrow transaction
    await Transaction.create(
      [
        {
          userId: learnerId,
          amount: 0,
          credits: -creditsRequired,
          status: "transfer_sent",
          description: `Session escrow: ${skill} with ${mentor.name}`,
          paymentId: `ESC_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    // Populate for response
    const populated = await Session.findById(newSession._id)
      .populate("learner", "name username picture")
      .populate("mentor", "name username picture preferences");

    // ── Send email notification to mentor (fire-and-forget) ──
    try {
      const formattedDate = scheduledDate.toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
      });
      const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', hour12: true
      });

      const emailHtml = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f9; padding: 40px; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📚 New Session Booking</h1>
              <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0 0; font-size: 14px;">SkillGain — Someone wants to learn from you!</p>
            </div>
            <div style="padding: 40px;">
              <p style="font-size: 16px; line-height: 1.6;">Hello <strong>${mentor.name}</strong>,</p>
              <p style="font-size: 16px; line-height: 1.6;"><strong>${learner.name}</strong> (@${learner.username}) has booked a mentorship session with you on <strong>VidhyaTransfer</strong>.</p>
              
              <div style="background-color: #f8f9fa; border-left: 4px solid #6366f1; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <p style="margin: 0 0 12px 0;"><strong>🎯 Skill:</strong> ${skill}</p>
                <p style="margin: 0 0 12px 0;"><strong>🗓 Scheduled Date:</strong> ${formattedDate}</p>
                <p style="margin: 0 0 12px 0;"><strong>⏰ Time:</strong> ${formattedTime}</p>
                <p style="margin: 0 0 12px 0;"><strong>⏱ Duration:</strong> ${sessionDuration} minutes</p>
                <p style="margin: 0 0 12px 0;"><strong>💰 Credits Escrowed:</strong> ${creditsRequired} credits</p>
                <p style="margin: 0 0 12px 0;"><strong>💵 Rate:</strong> ${ratePerHour} credits/hour</p>
                ${message ? `<p style="margin: 0;"><strong>💬 Message:</strong> ${message}</p>` : ''}
              </div>
              
              <p style="font-size: 16px; line-height: 1.6;">Please log in to <strong>VidhyaTransfer</strong> to <strong>accept</strong> or <strong>decline</strong> this session request.</p>
              
              <p style="font-size: 14px; color: #666; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                This is an automated notification from VidhyaTransfer SkillGain. The credits are held in escrow and will be released to you upon session completion.
              </p>
            </div>
          </div>
        </div>
      `;

      sendMail(
        mentor.email,
        `New Session Booking: ${skill} — ${learner.name}`,
        emailHtml
      );
    } catch (emailErr) {
      console.error("Failed to send session booking email to mentor:", emailErr);
      // Don't fail the booking if email fails
    }

    res.status(201).json(
      new ApiResponse(201, { session: populated, learnerCredits: learner.credits }, "Session booked! Credits held in escrow until mentor accepts.")
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── ACCEPT SESSION (Mentor accepts) ──────────────────────────────────────────
export const acceptSession = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.mentor.toString() !== mentorId.toString()) {
    throw new ApiError(403, "Only the mentor can accept this session");
  }
  if (session.status !== "pending") {
    throw new ApiError(400, `Session is already ${session.status}`);
  }

  session.status = "accepted";
  session.acceptedAt = new Date();
  await session.save();

  const populated = await Session.findById(sessionId)
    .populate("learner", "name username picture")
    .populate("mentor", "name username picture");

  res.status(200).json(
    new ApiResponse(200, { session: populated }, "Session accepted")
  );
});

// ─── DECLINE SESSION (Mentor declines → refund) ──────────────────────────────
export const declineSession = asyncHandler(async (req, res) => {
  const mentorId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.mentor.toString() !== mentorId.toString()) {
    throw new ApiError(403, "Only the mentor can decline this session");
  }
  if (session.status !== "pending") {
    throw new ApiError(400, `Session is already ${session.status}`);
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Refund credits to learner
    await User.findByIdAndUpdate(
      session.learner,
      { $inc: { credits: session.creditsEscrowed } },
      { session: dbSession }
    );

    session.status = "declined";
    session.cancelledAt = new Date();
    await session.save({ session: dbSession });

    // Log refund transaction
    await Transaction.create(
      [
        {
          userId: session.learner,
          amount: 0,
          credits: session.creditsEscrowed,
          status: "transfer_received",
          description: `Refund: Session declined by mentor`,
          paymentId: `REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    res.status(200).json(
      new ApiResponse(200, null, "Session declined. Credits refunded to learner.")
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── COMPLETE SESSION (Learner confirms → credits released to mentor) ─────────
export const completeSession = asyncHandler(async (req, res) => {
  const learnerId = req.user._id;
  const { sessionId } = req.params;
  const { rating, reviewNote } = req.body;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.learner.toString() !== learnerId.toString()) {
    throw new ApiError(403, "Only the learner can confirm session completion");
  }
  if (!["accepted", "in_progress"].includes(session.status)) {
    throw new ApiError(400, `Cannot complete a session with status: ${session.status}`);
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Release credits to mentor
    await User.findByIdAndUpdate(
      session.mentor,
      { $inc: { credits: session.creditsEscrowed } },
      { session: dbSession }
    );

    session.status = "completed";
    session.completedAt = new Date();
    if (rating) session.rating = rating;
    if (reviewNote) session.reviewNote = reviewNote;
    await session.save({ session: dbSession });

    // Log credit release transaction
    await Transaction.create(
      [
        {
          userId: session.mentor,
          amount: 0,
          credits: session.creditsEscrowed,
          status: "transfer_received",
          description: `Session completed: ${session.skill}`,
          paymentId: `SES_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    res.status(200).json(
      new ApiResponse(200, null, "Session completed! Credits released to mentor.")
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── CANCEL SESSION ───────────────────────────────────────────────────────────
// Pending sessions: either party can cancel
// Accepted sessions: only the MENTOR can cancel
export const cancelSession = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");

  const isLearner = session.learner.toString() === userId.toString();
  const isMentor = session.mentor.toString() === userId.toString();

  if (!isLearner && !isMentor) {
    throw new ApiError(403, "You are not part of this session");
  }
  if (!["pending", "accepted"].includes(session.status)) {
    throw new ApiError(400, `Cannot cancel a session with status: ${session.status}`);
  }

  // After acceptance, only the mentor can cancel
  if (session.status === "accepted" && !isMentor) {
    throw new ApiError(403, "Only the mentor can cancel an accepted session");
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Refund credits to learner
    await User.findByIdAndUpdate(
      session.learner,
      { $inc: { credits: session.creditsEscrowed } },
      { session: dbSession }
    );

    session.status = "cancelled";
    session.cancelledAt = new Date();
    await session.save({ session: dbSession });

    // Log refund
    await Transaction.create(
      [
        {
          userId: session.learner,
          amount: 0,
          credits: session.creditsEscrowed,
          status: "transfer_received",
          description: `Session cancelled (refund)`,
          paymentId: `CAN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    res.status(200).json(
      new ApiResponse(200, null, "Session cancelled. Credits refunded.")
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── GET MY SESSIONS (both as learner and mentor) ─────────────────────────────
export const getMySessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { role, status } = req.query; // role: "learner" | "mentor" | undefined (both)

  const filter = {};

  if (role === "learner") {
    filter.learner = userId;
  } else if (role === "mentor") {
    filter.mentor = userId;
  } else {
    filter.$or = [{ learner: userId }, { mentor: userId }];
  }

  if (status) {
    filter.status = status;
  }

  const sessions = await Session.find(filter)
    .populate("learner", "name username picture credits")
    .populate("mentor", "name username picture preferences")
    .sort({ createdAt: -1 });

  res.status(200).json(
    new ApiResponse(200, { sessions }, "Sessions fetched")
  );
});

// ─── GET SESSION BY ID ────────────────────────────────────────────────────────
export const getSessionById = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId)
    .populate("learner", "name username picture credits")
    .populate("mentor", "name username picture preferences");

  if (!session) throw new ApiError(404, "Session not found");

  // Only participants can view
  const isParticipant =
    session.learner._id.toString() === userId.toString() ||
    session.mentor._id.toString() === userId.toString();

  if (!isParticipant) {
    throw new ApiError(403, "You are not part of this session");
  }

  res.status(200).json(new ApiResponse(200, { session }, "Session details"));
});

// ─── GET SESSION REVIEWS FOR A USER (Public – for profile) ────────────────────
export const getSessionReviews = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (!userId) throw new ApiError(400, "User ID is required");

  // Find completed sessions where this user was the mentor AND a rating exists
  const reviews = await Session.find({
    mentor: userId,
    status: { $in: ["completed", "auto_completed"] },
    rating: { $ne: null },
  })
    .populate("learner", "name username picture")
    .select("skill rating reviewNote completedAt createdAt learner duration")
    .sort({ completedAt: -1 })
    .limit(20);

  res.status(200).json(
    new ApiResponse(200, { reviews }, "Session reviews fetched")
  );
});
