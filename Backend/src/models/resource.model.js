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
            enum: ["note", "roadmap"],
            required: true,
        },
        skill: {
            type: String,
            required: true,
            trim: true,
        },
        levelOrTimeframe: {
            type: String,
            required: true,
        },
        content: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

export const Resource = mongoose.model("Resource", resourceSchema);
