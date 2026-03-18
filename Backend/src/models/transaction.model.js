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
            required: false,
            unique: true,
            sparse: true,
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
            enum: ["created", "paid", "failed", "transfer_sent", "transfer_received"],
            default: "created",
        },
        description: {
            type: String,
            default: "",
        },
    },
    { timestamps: true }
);

export const Transaction = mongoose.model("Transaction", transactionSchema);
