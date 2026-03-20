import mongoose, { Schema } from "mongoose";

const sessionSchema = new Schema(
  {
    learner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    mentor: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skill: {
      type: String,
      required: true,
    },
    // Credits held in escrow for this session
    creditsEscrowed: {
      type: Number,
      required: true,
      min: 1,
    },
    // Mentor's hourly rate at time of booking (snapshot)
    ratePerHour: {
      type: Number,
      required: true,
    },
    // Duration in minutes
    duration: {
      type: Number,
      required: true,
      default: 60,
    },
    // Scheduling
    scheduledAt: {
      type: Date,
      required: true,
    },
    // Optional message from learner
    message: {
      type: String,
      default: "",
      maxlength: 500,
    },
    status: {
      type: String,
      enum: [
        "pending",     // Mentor hasn't accepted yet
        "accepted",    // Mentor accepted, credits escrowed
        "declined",    // Mentor declined, credits refunded
        "in_progress", // Session is happening
        "completed",   // Learner confirmed, credits released to mentor
        "disputed",    // Learner raised a dispute
        "cancelled",   // Either party cancelled before session
        "auto_completed", // Auto-released after 48h with no action
      ],
      default: "pending",
    },
    // Timestamps for lifecycle tracking
    acceptedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    // Rating given after completion (optional)
    rating: { type: Number, default: null, min: 1, max: 5 },
    reviewNote: { type: String, default: "" },
  },
  { timestamps: true }
);

// Indexes for common queries
sessionSchema.index({ learner: 1, status: 1 });
sessionSchema.index({ mentor: 1, status: 1 });
sessionSchema.index({ status: 1, scheduledAt: 1 });

export const Session = mongoose.model("Session", sessionSchema);
