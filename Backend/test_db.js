import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./src/models/user.model.js";
import { DB_NAME } from "./src/constants.js";

dotenv.config();

const check = async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        const user = await User.findOne({ email: "admin@skillswap.com" });
        if (user) {
            console.log("Admin User Found:");
            console.log("Email:", user.email);
            console.log("Role:", user.role);
            console.log("Username:", user.username);
            console.log("Password (hashed):", user.password);
        } else {
            console.log("Admin User NOT Found");
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

check();
