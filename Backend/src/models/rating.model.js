import mongoose, { Schema } from "mongoose";

const ratingSchema = new Schema(
  {
    rating: {
      type: Number,
      required: true,
    },
    rater: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    description: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Add unique index to prevent duplicate ratings from the same user to the same target
ratingSchema.index({ rater: 1, username: 1 }, { unique: true });

export const Rating = mongoose.model("Rating", ratingSchema);
