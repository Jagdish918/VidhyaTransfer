import mongoose, { Schema } from "mongoose";

const eventSchema = new Schema(
    {
        title: {
            type: String,
            required: true,
        },
        shortDescription: {
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
        startTime: {
            type: String, // e.g., "14:00"
            required: true,
        },
        endTime: {
            type: String, // e.g., "16:00"
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        credits: {
            type: Number,
            required: true,
            default: 0,
        },
        maxParticipants: {
            type: Number,
            required: true,
            default: 50,
        },
        tags: {
            type: [String],
            default: [],
        },
        learningOutcomes: {
            type: [String], // Array of strings for bullet points
            default: [],
        },
        participants: [{
            type: Schema.Types.ObjectId,
            ref: "User",
        }],
        link: {
            type: String, // Optional external link
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
