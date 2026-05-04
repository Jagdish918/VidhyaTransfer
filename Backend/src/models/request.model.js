import mongoose, { Schema } from "mongoose";

const requestSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    receiver: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    status: {
      type: String,
      enum: ["Pending", "Rejected", "Connected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

export const Request = mongoose.model("Request", requestSchema);

// ✅ Architecture Fix: Enforce database uniqueness. No duplicate requests allowed between two edge users regardless of race conditions.
requestSchema.index({ sender: 1, receiver: 1 }, { unique: true });
requestSchema.index({ receiver: 1, status: 1 }); // for getRequests (pending requests for a user)
