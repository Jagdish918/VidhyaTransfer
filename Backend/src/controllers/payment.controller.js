import Razorpay from "razorpay";
import crypto from "crypto";
import { User } from "../models/user.model.js";

// Initialize Razorpay
let razorpay;
try {
    razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    console.log("Razorpay Initialized Successfully");
} catch (error) {
    console.error("Razorpay Initialization Error:", error);
}

export const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount) {
            return res.status(400).json({ message: "Amount is required" });
        }

        const options = {
            amount: amount * 100, // amount in smallest currency unit (paise)
            currency: "INR",
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        res.status(200).json(order);
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ message: "Something went wrong" });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, credits, amount } = req.body;
        const userId = req.user._id;

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Update user credits
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            user.credits += Number(credits);
            await user.save();

            res.status(200).json({
                message: "Payment successful and credits added",
                credits: user.credits
            });
        } else {
            res.status(400).json({ message: "Invalid signature" });
        }
    } catch (error) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

export const getKey = (req, res) => {
    try {
        console.log("Getting Razorpay Key:", process.env.RAZORPAY_KEY_ID);
        if (!process.env.RAZORPAY_KEY_ID) {
            throw new Error("RAZORPAY_KEY_ID is missing");
        }
        res.status(200).json({ key: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error("Get Key Error:", error);
        res.status(500).json({ message: "Error fetching key" });
    }
};
