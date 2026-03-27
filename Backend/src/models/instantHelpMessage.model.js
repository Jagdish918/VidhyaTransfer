import mongoose, { Schema } from "mongoose";

const instantHelpMessageSchema = new Schema(
  {
    sessionId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Session",
    },
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    content: {
      type: String,
      trim: true,
      required: true,
    },
  },
  { timestamps: true }
);

export const InstantHelpMessage = mongoose.model("InstantHelpMessage", instantHelpMessageSchema);

// Index for fast message retrieval by session
instantHelpMessageSchema.index({ sessionId: 1, createdAt: -1 });
