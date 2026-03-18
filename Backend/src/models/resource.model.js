import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: ["roadmap"], // We only store unified roadmaps now
            required: true,
        },
        skill: {
            type: String,
            required: true,
            trim: true,
        },
        timeframe: {
            type: String, // e.g. "1 Month", "3 Months", "Flexible"
            required: true,
        },
        roadmapData: {
            // A structured JSON object containing topics and subtopics
            type: Object,
            default: {}
        },
        testData: {
            status: {
                type: String,
                enum: ["locked", "ready", "in_progress", "completed"],
                default: "locked"
            },
            questions: {
                type: Array,
                default: []
            },
            score: {
                type: Number,
                default: null
            },
            analytics: {
                type: String,
                default: ""
            },
            startedAt: {
                type: Date,
                default: null
            }
        },
    },
    {
        timestamps: true,
    }
);

export const Resource = mongoose.model("Resource", resourceSchema);
