import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { User } from "../models/user.model.js";

// Load env vars
dotenv.config();

const DB_NAME = "vidyatransfer";
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env");
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

async function hashPassword(password) {
    return await bcrypt.hash(password, 10);
}

const skillsList = ["React", "Node.js", "Python", "Java", "C++", "MongoDB", "Figma", "Marketing", "SEO"];

const seedTestUsers = async () => {
    try {
        await connectDB();
        const hashedPassword = await hashPassword("pass123");

        console.log("Removing previous test users...");
        await User.deleteMany({ email: { $regex: /^test_(mentor|helper|expert|normal)\d+@skillswap\.com$/ } });

        const users = [];

        // 1. Mentors (Skill Gain) - 5 users
        for (let i = 1; i <= 5; i++) {
            users.push({
                name: `Mentor User ${i}`,
                username: `mentor${i}`,
                email: `test_mentor${i}@skillswap.com`,
                password: hashedPassword,
                picture: `https://ui-avatars.com/api/?name=Mentor+${i}&background=0D8ABC&color=fff`,
                skillsProficientAt: [{ name: skillsList[i % skillsList.length], proficiency: "Expert" }],
                skillsToLearn: [],
                onboardingCompleted: true,
                onboardingStep: 3,
                primaryGoal: "Skill Gain",
                preferences: {
                    utilization: [], // Not primarily looking for work, but teaching
                    rates: {
                        mentorship: 30 + (i * 10), // 40, 50, 60... credits/hr
                        instantHelp: 0,
                        freelance: 0
                    }
                }
            });
        }

        // 2. Instant Help Providers - 5 users
        for (let i = 1; i <= 5; i++) {
            users.push({
                name: `Helper User ${i}`,
                username: `helper${i}`,
                email: `test_helper${i}@skillswap.com`,
                password: hashedPassword,
                picture: `https://ui-avatars.com/api/?name=Helper+${i}&background=F59E0B&color=fff`,
                skillsProficientAt: [{ name: skillsList[(i + 2) % skillsList.length], proficiency: "Advanced" }],
                skillsToLearn: [],
                onboardingCompleted: true,
                onboardingStep: 3,
                primaryGoal: "Peer Swap",
                preferences: {
                    utilization: ["Instant Help"],
                    rates: {
                        mentorship: 0,
                        instantHelp: 15 + (i * 5), // 20, 25, 30... credits/session
                        freelance: 0
                    }
                }
            });
        }

        // 3. Experts / Freelancers - 5 users
        for (let i = 1; i <= 5; i++) {
            users.push({
                name: `Expert User ${i}`,
                username: `expert${i}`,
                email: `test_expert${i}@skillswap.com`,
                password: hashedPassword,
                picture: `https://ui-avatars.com/api/?name=Expert+${i}&background=10B981&color=fff`,
                skillsProficientAt: [{ name: skillsList[(i + 4) % skillsList.length], proficiency: "Expert" }],
                skillsToLearn: [],
                onboardingCompleted: true,
                onboardingStep: 3,
                primaryGoal: "Skill Gain", // Could be either
                preferences: {
                    utilization: ["Hire Expert"],
                    rates: {
                        mentorship: 0,
                        instantHelp: 0,
                        freelance: 80 + (i * 20) // 100, 120... credits/hr
                    }
                }
            });
        }

        // 4. Multi-talented Users (doing everything) - 3 users
        for (let i = 1; i <= 3; i++) {
            users.push({
                name: `Super User ${i}`,
                username: `super${i}`,
                email: `test_super${i}@skillswap.com`,
                password: hashedPassword,
                picture: `https://ui-avatars.com/api/?name=Super+${i}&background=7C3AED&color=fff`,
                skillsProficientAt: [
                    { name: "Full Stack", proficiency: "Expert" },
                    { name: "AI/ML", proficiency: "Advanced" }
                ],
                skillsToLearn: [],
                onboardingCompleted: true,
                onboardingStep: 3,
                primaryGoal: "Skill Gain",
                preferences: {
                    utilization: ["Instant Help", "Hire Expert", "Events"],
                    rates: {
                        mentorship: 100,
                        instantHelp: 50,
                        freelance: 200
                    }
                }
            });
        }

        await User.insertMany(users);
        console.log(`Seeded ${users.length} test users successfully!`);
        console.log("Credentials -> Password: pass123");
        console.log("Mentors: test_mentor1@skillswap.com ...");
        console.log("Helpers: test_helper1@skillswap.com ...");
        console.log("Experts: test_expert1@skillswap.com ...");
        process.exit();

    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedTestUsers();
