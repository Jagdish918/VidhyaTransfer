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

// ✅ Fix #7: Compound index — queried on every notifications load, accept, reject, and duplicate check
requestSchema.index({ sender: 1, receiver: 1, status: 1 });
requestSchema.index({ receiver: 1, status: 1 }); // for getRequests (pending requests for a user)
