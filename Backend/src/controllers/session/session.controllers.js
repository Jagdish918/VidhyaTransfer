import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Session } from "../../models/session.model.js";
import { Transaction } from "../../models/transaction.model.js";
import { Request } from "../../models/request.model.js";

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
