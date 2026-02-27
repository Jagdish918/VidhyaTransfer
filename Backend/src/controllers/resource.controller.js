import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resource } from "../models/resource.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const generateNote = async (req, res) => {
    try {
        const { skill, proficiency } = req.body;
        const userId = req.user?._id;

        if (!skill || !proficiency) {
            return res.status(400).json({ message: "Skill and proficiency are required." });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized request." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert tutor. Create a detailed, well-structured, and comprehensive learning note about the topic "${skill}" for a student at the "${proficiency}" level. Use markdown formatting. Include sections for an Introduction, Key Concepts, Examples, and a Summary.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Save to Database
        const savedResource = await Resource.create({
            userId,
            type: "note",
            skill,
            levelOrTimeframe: proficiency,
            content: text
        });

        res.status(200).json({ note: text, resourceId: savedResource._id });
    } catch (error) {
        console.error("Error generating note:", error);
        res.status(500).json({ message: "Failed to generate note." });
    }
};

export const generateRoadmap = async (req, res) => {
    try {
        const { skill, timeframe } = req.body;
        const userId = req.user?._id;

        if (!skill || !timeframe) {
            return res.status(400).json({ message: "Skill and timeframe are required." });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized request." });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert mentor. Create a detailed, week-by-week learning roadmap for the skill "${skill}" to be completed in ${timeframe}. Use markdown formatting. Organize it logically by weeks or phases, and include specific milestones or topics to cover in each phase. Start directly with the markdown.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Save to Database
        const savedResource = await Resource.create({
            userId,
            type: "roadmap",
            skill,
            levelOrTimeframe: timeframe,
            content: text
        });

        res.status(200).json({ roadmap: text, resourceId: savedResource._id });
    } catch (error) {
        console.error("Error generating roadmap:", error);
        res.status(500).json({ message: "Failed to generate roadmap." });
    }
};

export const getSavedResources = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized request." });
        }

        const resources = await Resource.find({ userId }).sort({ createdAt: -1 });

        res.status(200).json({ data: resources });
    } catch (error) {
        console.error("Error fetching saved resources:", error);
        res.status(500).json({ message: "Failed to fetch saved resources." });
    }
};
