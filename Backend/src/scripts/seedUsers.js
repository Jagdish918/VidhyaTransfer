import mongoose from "mongoose";
import dotenv from "dotenv";
import crypto from "crypto";
import { User } from "../models/user.model.js";

// Load env vars
dotenv.config();

const DB_NAME = "vidyatransfer";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI is missing in .env");
    // Try to find it in ../../.env if not found?
    // Usually dotenv.config() looks in current dir. 
    // I'll assume valid environment or hardcode if needed (but I won't hardcode credentials).
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

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return `${salt}:${hash}`;
}

const skillsList = ["React", "Node.js", "Python", "Java", "C++", "MongoDB", "SQL", "AWS", "Docker", "Figma", "UI/UX", "Machine Learning", "Data Science", "Marketing", "SEO", "Content Writing", "Public Speaking"];
const degrees = ["B.Tech", "B.Sc", "M.Tech", "MBA", "BCA", "MCA"];
const institutions = ["IIT Bombay", "BITS Pilani", "Delhi University", "VIT", "SRM", "Manipal University", "Amity University"];

const firstNames = ["James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda", "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica", "Thomas", "Sarah", "Charles", "Karen", "Christopher", "Nancy", "Daniel", "Lisa", "Matthew", "Betty", "Anthony", "Margaret", "Mark", "Sandra"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin", "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"];

const seedUsers = async () => {
    try {
        await connectDB();

        // Clear existing users matching pattern to replace them
        await User.deleteMany({ email: { $regex: /^user\d+@gmail\.com$/ } });

        const users = [];

        for (let i = 1; i <= 50; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullName = `${firstName} ${lastName}`;
            const userName = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_${i}`;

            const randomSkill1 = skillsList[Math.floor(Math.random() * skillsList.length)];
            const randomSkill2 = skillsList[Math.floor(Math.random() * skillsList.length)];
            const randomDegree = degrees[Math.floor(Math.random() * degrees.length)];
            const randomInst = institutions[Math.floor(Math.random() * institutions.length)];

            users.push({
                name: fullName,
                username: userName,
                email: `user${i}@gmail.com`,
                password: hashPassword("admin123"),
                skillsProficientAt: [
                    { name: randomSkill1, proficiency: "Intermediate", category: "Programming" },
                    { name: randomSkill2, proficiency: "Beginner", category: "Programming" }
                ],
                skillsToLearn: [
                    { name: "Rust", proficiency: "Beginner", autoMatchTutors: false }
                ],
                education: [{
                    institution: randomInst,
                    degree: randomDegree,
                    startDate: new Date("2020-01-01"),
                    endDate: new Date("2024-05-01"),
                    score: 85,
                    description: "Graduated with honors"
                }],
                bio: `I am ${fullName}, passionate about ${randomSkill1} and ${randomSkill2}. Looking to connect with like-minded developers.`,
                projects: [
                    {
                        title: `${fullName}'s Project`,
                        description: "A cool project I worked on using my skills.",
                        projectLink: "https://github.com",
                        techStack: [], // Avoiding Schema validation error for now
                        startDate: new Date("2023-01-01"),
                        endDate: new Date("2023-06-01")
                    }
                ],
                // Fix techStack in runtime if needed.
                onboardingCompleted: true,
                onboardingStep: 2,
                picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=user${i}`,
                preferences: {
                    notifications: true,
                    autoMatch: false,
                    availability: 10,
                    mode: "Online",
                    skillsInterestedInLearning: ["Rust"]
                }
            });
        }

        // Correct techStack format if necessary
        // In Schema: techStack: [ { type: String, default: "" } ]
        // This actually defines an array of objects where each object has a property `type`? No.
        // It's likely array of strings. I'll stick to `[string]`.

        await User.insertMany(users);
        console.log("50 Users seeded successfully!");
        process.exit();
    } catch (error) {
        console.error("Error seeding users:", error);
        process.exit(1);
    }
};

seedUsers();
