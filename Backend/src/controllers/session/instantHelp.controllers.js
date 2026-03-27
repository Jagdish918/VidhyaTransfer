import mongoose from "mongoose";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { ApiError } from "../../utils/ApiError.js";
import { ApiResponse } from "../../utils/ApiResponse.js";
import { User } from "../../models/user.model.js";
import { Session } from "../../models/session.model.js";
import { Transaction } from "../../models/transaction.model.js";

// ─── REQUEST INSTANT HELP (Learner sends request to a provider) ───────────────
export const requestInstantHelp = asyncHandler(async (req, res) => {
  const learnerId = req.user._id;
  const { providerId, skill } = req.body;

  if (!providerId || !skill) {
    throw new ApiError(400, "Provider and skill are required");
  }

  if (learnerId.toString() === providerId.toString()) {
    throw new ApiError(400, "You cannot request instant help from yourself");
  }

  const provider = await User.findById(providerId);
  if (!provider) throw new ApiError(404, "Provider not found");

  const ratePerSession = provider.preferences?.rates?.instantHelp || 0;
  if (ratePerSession <= 0) {
    throw new ApiError(400, "This provider has not set an instant help rate");
  }

  const learner = await User.findById(learnerId);
  if (!learner) throw new ApiError(404, "User not found");

  if (learner.credits < ratePerSession) {
    throw new ApiError(
      400,
      `Insufficient credits. You need ${ratePerSession} credits but have ${learner.credits}.`
    );
  }

  // Check if there's already a pending instant help request to this provider
  const existing = await Session.findOne({
    learner: learnerId,
    mentor: providerId,
    type: "instant_help",
    status: "pending",
  });
  if (existing) {
    throw new ApiError(409, "You already have a pending request with this provider");
  }

  // --- Use a MongoDB transaction for atomicity ---
  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Deduct credits from learner (escrow)
    learner.credits -= ratePerSession;
    await learner.save({ session: dbSession });

    // Create the instant help session
    const [newSession] = await Session.create(
      [
        {
          type: "instant_help",
          learner: learnerId,
          mentor: providerId,
          skill,
          creditsEscrowed: ratePerSession,
          ratePerHour: ratePerSession,
          duration: 0, // Duration is tracked by actual meeting time
          scheduledAt: null,
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
          credits: -ratePerSession,
          status: "transfer_sent",
          description: `Instant help escrow: ${skill} with ${provider.name}`,
          paymentId: `IH_ESC_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    // Populate for response
    const populated = await Session.findById(newSession._id)
      .populate("learner", "name username picture")
      .populate("mentor", "name username picture preferences");

    // Emit socket event to provider
    const io = req.app.get("io");
    if (io) {
      io.to(providerId.toString()).emit("instantHelpRequest", {
        sessionId: populated._id,
        learner: {
          _id: learner._id,
          name: learner.name,
          username: learner.username,
          picture: learner.picture,
        },
        skill,
        credits: ratePerSession,
      });
    }

    res.status(201).json(
      new ApiResponse(
        201,
        { session: populated, learnerCredits: learner.credits },
        "Instant help request sent! Waiting for provider to accept."
      )
    );

    // --- AUTO-EXPIRE SETTING (2 minutes) ---
    setTimeout(async () => {
      try {
        const checkSession = await Session.findById(newSession._id);
        if (checkSession && checkSession.status === "pending") {
          
          const timeoutDbSession = await mongoose.startSession();
          timeoutDbSession.startTransaction();

          try {
            // Refund learner
            await User.findByIdAndUpdate(
              checkSession.learner,
              { $inc: { credits: checkSession.creditsEscrowed } },
              { session: timeoutDbSession }
            );

            checkSession.status = "expired";
            checkSession.cancelledAt = new Date();
            await checkSession.save({ session: timeoutDbSession });

            // Record transaction
            await Transaction.create(
              [
                {
                  userId: checkSession.learner,
                  amount: 0,
                  credits: checkSession.creditsEscrowed,
                  status: "transfer_received",
                  description: `Refund: Instant help request expired (${skill})`,
                  paymentId: `IH_EXPIRE_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
                },
              ],
              { session: timeoutDbSession }
            );

            await timeoutDbSession.commitTransaction();

            // Notify both parties
            if (io) {
              io.to(checkSession.learner.toString()).emit("instantHelpExpired", {
                sessionId: checkSession._id,
                message: "Your instant help request expired. Credits have been refunded.",
              });
              io.to(checkSession.mentor.toString()).emit("instantHelpExpired", {
                sessionId: checkSession._id,
                message: "An instant help request you received has expired.",
              });
            }
          } catch (err) {
            await timeoutDbSession.abortTransaction();
            console.error("Auto-expire refund failed:", err);
          } finally {
            timeoutDbSession.endSession();
          }
        }
      } catch (err) {
        console.error("Error checking session for expiration:", err);
      }
    }, 120000); // 2 minutes

  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── ACCEPT INSTANT HELP (Provider accepts) ───────────────────────────────────
export const acceptInstantHelp = asyncHandler(async (req, res) => {
  const providerId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.type !== "instant_help") {
    throw new ApiError(400, "This is not an instant help session");
  }
  if (session.mentor.toString() !== providerId.toString()) {
    throw new ApiError(403, "Only the provider can accept this request");
  }
  if (session.status !== "pending") {
    throw new ApiError(400, `Request is already ${session.status}`);
  }

  session.status = "in_progress";
  session.acceptedAt = new Date();
  await session.save();

  const populated = await Session.findById(sessionId)
    .populate("learner", "name username picture")
    .populate("mentor", "name username picture preferences");

  // Emit socket event to learner — they should start the video call
  const io = req.app.get("io");
  if (io) {
    io.to(session.learner.toString()).emit("instantHelpAccepted", {
      sessionId: session._id,
      provider: {
        _id: populated.mentor._id,
        name: populated.mentor.name,
        username: populated.mentor.username,
        picture: populated.mentor.picture,
      },
      skill: session.skill,
    });
  }

  res.status(200).json(
    new ApiResponse(200, { session: populated }, "Instant help accepted! Starting meeting.")
  );
});

// ─── DECLINE INSTANT HELP (Provider declines → refund) ────────────────────────
export const declineInstantHelp = asyncHandler(async (req, res) => {
  const providerId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.type !== "instant_help") {
    throw new ApiError(400, "This is not an instant help session");
  }
  if (session.mentor.toString() !== providerId.toString()) {
    throw new ApiError(403, "Only the provider can decline this request");
  }
  if (session.status !== "pending") {
    throw new ApiError(400, `Request is already ${session.status}`);
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
          description: `Refund: Instant help declined by provider`,
          paymentId: `IH_REF_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    // Notify learner
    const io = req.app.get("io");
    if (io) {
      io.to(session.learner.toString()).emit("instantHelpDeclined", {
        sessionId: session._id,
        message: "Your instant help request was declined. Credits have been refunded.",
      });
    }

    res.status(200).json(
      new ApiResponse(200, null, "Request declined. Credits refunded to learner.")
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── END INSTANT HELP SESSION (Learner only → credits released) ──────────────
export const endInstantHelpSession = asyncHandler(async (req, res) => {
  const learnerId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.type !== "instant_help") {
    throw new ApiError(400, "This is not an instant help session");
  }
  if (session.learner.toString() !== learnerId.toString()) {
    throw new ApiError(403, "Only the learner can end this session");
  }
  if (session.status !== "in_progress") {
    throw new ApiError(400, `Cannot end a session with status: ${session.status}`);
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Release credits to provider
    const provider = await User.findByIdAndUpdate(
      session.mentor,
      { $inc: { credits: session.creditsEscrowed } },
      { session: dbSession, new: true }
    );

    session.status = "completed";
    session.completedAt = new Date();
    await session.save({ session: dbSession });

    // Log credit release transaction for provider
    await Transaction.create(
      [
        {
          userId: session.mentor,
          amount: 0,
          credits: session.creditsEscrowed,
          status: "transfer_received",
          description: `Instant help completed: ${session.skill}`,
          paymentId: `IH_COM_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        },
      ],
      { session: dbSession }
    );

    await dbSession.commitTransaction();

    // Notify provider that session ended
    const io = req.app.get("io");
    if (io) {
      io.to(session.mentor.toString()).emit("instantHelpSessionEnded", {
        sessionId: session._id,
        credits: session.creditsEscrowed,
        message: "The instant help session was ended by the learner. Credits have been transferred to you.",
      });
      // Also notify learner themselves to clear their UI
      io.to(session.learner.toString()).emit("instantHelpSessionEnded", {
        sessionId: session._id,
        message: "You ended the instant help session.",
      });
    }

    res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Session completed! Credits released to the provider."
      )
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});

// ─── TRIGGER MUTUAL START MEETING ──────────────────────────────────────────────
export const startInstantHelpMeeting = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  
  if (session.learner.toString() !== userId.toString() && session.mentor.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not part of this session");
  }

  if (session.status !== "in_progress") {
    throw new ApiError(400, "Session is not active");
  }

  // Determine partner
  const partnerId = session.learner.toString() === userId.toString() ? session.mentor : session.learner;

  const io = req.app.get("io");
  if (io) {
    // Tell both the initiator and the partner to start the meeting
    io.to(userId.toString()).emit("startInstantHelpMeeting", { sessionId: session._id, partnerId });
    io.to(partnerId.toString()).emit("startInstantHelpMeeting", { sessionId: session._id, partnerId: userId });
  }

  res.status(200).json(new ApiResponse(200, null, "Meeting started on both sides"));
});

// ─── GET INSTANT HELP SESSIONS FOR USER ───────────────────────────────────────
export const getMyInstantHelpSessions = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page) || 1;
  const limit = 20;

  const total = await Session.countDocuments({
    type: "instant_help",
    $or: [{ learner: userId }, { mentor: userId }]
  });

  const sessions = await Session.find({
    type: "instant_help",
    $or: [{ learner: userId }, { mentor: userId }]
  })
    .populate("learner", "name username picture")
    .populate("mentor", "name username picture")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json(new ApiResponse(200, {
    sessions,
    pagination: { page, pages: Math.ceil(total / limit), total, hasMore: (page * limit) < total }
  }, "Sessions retrieved successfully"));
});