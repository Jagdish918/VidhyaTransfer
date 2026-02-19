import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../models/user.model.js";
import { Transaction } from "../models/transaction.model.js";

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

export const createOrder = async (req, res) => {
    try {
        if (!razorpay) {
            return res.status(500).json({ message: "Payment gateway not initialized" });
        }

        const { amount, credits } = req.body; // Expect credits to be sent from frontend to know which pack was chosen

        if (!amount || !credits) {
            return res.status(400).json({ message: "Amount and credits are required" });
        }

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Save transaction to DB
        await Transaction.create({
            userId: req.user._id,
            orderId: order.id,
            amount: amount,
            credits: credits,
            status: "created"
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

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Find the transaction
            const transaction = await Transaction.findOne({ orderId: razorpay_order_id });

            if (!transaction) {
                return res.status(404).json({ message: "Transaction not found" });
            }

            if (transaction.status === "paid") {
                return res.status(400).json({ message: "Transaction already processed" });
            }

            // Update user credits
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            // Trust the database record for credits, NOT the frontend
            user.credits += Number(transaction.credits);
            await user.save();

            // Update transaction status
            transaction.status = "paid";
            transaction.paymentId = razorpay_payment_id;
            await transaction.save();

            res.status(200).json({
                message: "Payment successful and credits added",
                credits: user.credits
            });
        } else {
            // Mark transaction as failed if signature is invalid (optional, but good practice)
            await Transaction.findOneAndUpdate(
                { orderId: razorpay_order_id },
                { status: "failed", paymentId: razorpay_payment_id }
            );
            res.status(400).json({ message: "Invalid signature" });
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
