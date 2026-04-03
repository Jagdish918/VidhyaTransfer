import mongoose, { Schema } from "mongoose";

const reportSchema = new Schema(
  {
    reporter: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    reported: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    nature: {
      type: String,
      enum: ["Personal conduct", "Professional expertise", "Others"],
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "dismissed", "banned"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Prevent duplicate reports from same person to same person
reportSchema.index({ reporter: 1, reported: 1 }, { unique: true });

export const Report = mongoose.model("Report", reportSchema);
