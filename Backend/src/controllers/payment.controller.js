import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";
import { ApiError } from "../utils/ApiError.js";
import mongoose from "mongoose";

// Initialize Razorpay
let razorpay;
try {
    if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
        razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        console.log("Razorpay Initialized Successfully");
    } else {
        console.error("Razorpay Keys Missing in Environment Variables");
    }
} catch (error) {
    console.error("Razorpay Initialization Error:", error);
}

// Key = number of credits, Value = price in INR (₹)
const CREDIT_PACKAGES = {
    100: 99,
    250: 199,
    500: 349,
    1000: 699,
};

export const createOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({ message: "Payment gateway not initialized" });
        }

        const { credits } = req.body;

        if (!credits) {
            return res.status(400).json({ message: "Credits package selection is required" });
        }

        // ✅ SECURITY FIX: Look up the price server-side — ignore any amount from the client
        const serverAmount = CREDIT_PACKAGES[Number(credits)];
        if (!serverAmount) {
            return res.status(400).json({
                message: `Invalid credit package. Available options: ${Object.keys(CREDIT_PACKAGES).join(", ")} credits`,
            });
        }

        const options = {
            amount: serverAmount * 100, // Convert to paise (smallest INR unit)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Save transaction to DB with server-verified amount and credits
        await Transaction.create({
            userId: req.user._id,
            orderId: order.id,
            amount: serverAmount,   // Server-determined amount
            credits: Number(credits),
            status: "created",
        });

        res.status(200).json(order);
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const userId = req.user._id;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ message: "Missing payment verification parameters" });
        }

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        // ✅ Use timingSafeEqual to prevent timing attacks on HMAC comparison
        const sigBuffer = Buffer.from(razorpay_signature, "hex");
        const expectedBuffer = Buffer.from(expectedSignature, "hex");
        const isAuthentic =
            sigBuffer.length === expectedBuffer.length &&
            crypto.timingSafeEqual(sigBuffer, expectedBuffer);

        if (isAuthentic) {
            const transaction = await Transaction.findOne({ orderId: razorpay_order_id });

            if (!transaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            // ✅ Ensure transaction belongs to the requesting user (ownership check)
            if (transaction.userId.toString() !== userId.toString()) {
                return res.status(403).json({ message: "Not authorized to verify this transaction" });
            }

            if (transaction.status === "paid") {
                return res.status(400).json({ message: "Transaction already processed" });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Credits are sourced from DB transaction record — not the frontend
            user.credits += Number(transaction.credits);
            await user.save();

            transaction.status = "paid";
            transaction.paymentId = razorpay_payment_id;
            await transaction.save();

            res.status(200).json({
                message: "Payment successful and credits added",
                credits: user.credits,
            });
        } else {
            await Transaction.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: "failed", paymentId: razorpay_payment_id }
            );
            res.status(400).json({ message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getKey = (req, res) => {
    try {
        if (!process.env.RAZORPAY_KEY_ID) {
            throw new Error("RAZORPAY_KEY_ID is missing");
        }
        res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error("Get Key Error:", error);
        res.status(500).json({ message: "Error fetching key" });
    }
};

export const getTransactions = async (req, res) => {
    try {
        const userId = req.user._id;
        const transactions = await Transaction.find({ userId }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        console.error("Get Transactions Error:", error);
        res.status(500).json({ message: "Error fetching transactions" });
    }
};

export const transferCredits = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { receiverId, amount } = req.body;
        const senderId = req.user._id;

        if (!receiverId || !amount || amount <= 0) {
            return res.status(400).json({ message: "Receiver ID and valid amount are required" });
        }

        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({ message: "You cannot transfer credits to yourself" });
        }

        const sender = await User.findById(senderId).session(session);
        const receiver = await User.findById(receiverId).session(session);

        if (!sender || !receiver) {
            throw new Error("Sender or Receiver not found");
        }

        if (sender.credits < amount) {
            throw new Error("Insufficient credits");
        }

        sender.credits -= Number(amount);
        receiver.credits += Number(amount);

        await sender.save({ session });
        await receiver.save({ session });

        await Transaction.create([{
            userId: senderId,
            amount: 0,
            credits: -Number(amount),
            status: "transfer_sent",
            description: `Sent to ${receiver.name}`,
            paymentId: `P2P_S_${Date.now()}`
        }], { session });

        await Transaction.create([{
            userId: receiverId,
            amount: 0,
            credits: Number(amount),
            status: "transfer_received",
            description: `Received from ${sender.name}`,
            paymentId: `P2P_R_${Date.now()}`
        }], { session });

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Credits transferred", senderCredits: sender.credits });
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: error.message });
    } finally {
        session.endSession();
    }
};
