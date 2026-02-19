import mongoose, { Schema } from "mongoose";

const transactionSchema = new Schema(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        orderId: {
            type: String,
            required: true,
            unique: true,
        },
        paymentId: {
            type: String,
            default: null,
        },
        amount: {
            type: Number,
            required: true,
        },
        credits: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["created", "paid", "failed"],
            default: "created",
        },
    },
    { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
