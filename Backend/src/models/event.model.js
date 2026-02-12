import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        link: {
            type: String, // e.g., Meet link or Registration link
            default: "",
        },
        image: {
            type: String, // URL from Cloudinary
            default: "",
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["upcoming", "past", "cancelled"],
            default: "upcoming"
        }
    },
    { timestamps: true }
);

export const Event = mongoose.model("Event", eventSchema);
