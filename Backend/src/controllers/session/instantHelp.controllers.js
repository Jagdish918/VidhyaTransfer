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

// ─── END INSTANT HELP SESSION (Provider only → credits released) ──────────────
export const endInstantHelpSession = asyncHandler(async (req, res) => {
  const providerId = req.user._id;
  const { sessionId } = req.params;

  const session = await Session.findById(sessionId);
  if (!session) throw new ApiError(404, "Session not found");
  if (session.type !== "instant_help") {
    throw new ApiError(400, "This is not an instant help session");
  }
  if (session.mentor.toString() !== providerId.toString()) {
    throw new ApiError(403, "Only the provider can end this session");
  }
  if (session.status !== "in_progress") {
    throw new ApiError(400, `Cannot end a session with status: ${session.status}`);
  }

  const dbSession = await mongoose.startSession();
  dbSession.startTransaction();

  try {
    // Release credits to provider
    const provider = await User.findByIdAndUpdate(
      providerId,
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
          userId: providerId,
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

    // Notify learner that session ended
    const io = req.app.get("io");
    if (io) {
      io.to(session.learner.toString()).emit("instantHelpSessionEnded", {
        sessionId: session._id,
        credits: session.creditsEscrowed,
        message: "The instant help session has ended. Credits have been transferred to the provider.",
      });
    }

    res.status(200).json(
      new ApiResponse(
        200,
        { providerCredits: provider.credits },
        "Session completed! Credits released to you."
      )
    );
  } catch (error) {
    await dbSession.abortTransaction();
    throw error;
  } finally {
    dbSession.endSession();
  }
});
