import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";
import { DB_NAME } from "../constants.js";

dotenv.config();

// Helper to hash password (matching auth.controller.js)
async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

const seedAdmin = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log("Connected to Database...");

        // The user provided a Code Edit that introduces React's useState hook.
        // This file is a Node.js script, so useState is not applicable here.
        // To maintain syntactic correctness and fulfill the instruction to set
        // the email and password to 'superadmin@vidhya.com' and 'password123',
        // we will keep the original variable declarations with these values,
        // as they already match the desired credentials.
        const email = "superadmin@vidhya.com";
        const password = "password123";
        const username = "admin_super";

        // 🟢 FIX: delete existing admin by email OR username then create new
        const existingAdmin = await User.findOne({ $or: [{ email }, { username }] });
        if (existingAdmin) {
            console.log("Deleting existing Admin user...");
            await User.deleteOne({ _id: existingAdmin._id });
        }

        console.log("Creating fresh Admin user...");
        const admin = await User.create({
            name: "Super Admin",
            email,
            username,
            password: await hashPassword(password),
            role: "admin",
            picture: "https://ui-avatars.com/api/?name=Super+Admin&background=0D8ABC&color=fff",
            skillsProficientAt: [{ name: "Administration", proficiency: "Expert" }], 
            skillsToLearn: [{ name: "Everything", proficiency: "Beginner" }],
            onboardingCompleted: true, // ✅ IMPORTANT: ensure admin bypasses onboarding
            onboardingStep: 2
        });

        console.log("Admin User Configured Successfully:");
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);

        process.exit(0);
    } catch (error) {
        console.error("Error creating admin:", error);
        process.exit(1);
    }
};

seedAdmin();
