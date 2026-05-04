import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    users: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    latestMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Architecture Fix: Queries are repeatedly running find({ users: userId }).sort({ updatedAt: -1 })
chatSchema.index({ users: 1, updatedAt: -1 });

export const Chat = mongoose.model("Chat", chatSchema);
