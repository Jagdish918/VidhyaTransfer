import { GoogleGenerativeAI } from "@google/generative-ai";
import { User } from "../models/user.model.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to check if two dates are the same day
const isSameDay = (date1, date2) => {
    if (!date1 || !date2) return false;
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
};

// Helper function to check if date1 is exactly one day before date2
const isYesterday = (date1, date2) => {
    if (!date1 || !date2) return false;
    const yesterday = new Date(date2);
    yesterday.setDate(yesterday.getDate() - 1);
    return isSameDay(date1, yesterday);
};

export const getDailyQuiz = async (req, res) => {
    try {
        const userId = req.user?._id;
        if (!userId) return res.status(401).json({ message: "Unauthorized request." });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found." });

        const today = new Date();
        const dailyQuiz = user.dailyQuiz || { streak: 0, lastAttemptDate: null, lastGeneratedDate: null, currentQuestion: null };

        // 1. Check if user already completed the quiz today
        if (isSameDay(dailyQuiz.lastAttemptDate, today)) {
            return res.status(200).json({ 
                status: "completed", 
                streak: dailyQuiz.streak,
                message: "You already answered today's question. Come back tomorrow!" 
            });
        }

        // 2. Check if user already generated a question today but hasn't answered it yet
        if (isSameDay(dailyQuiz.lastGeneratedDate, today) && dailyQuiz.currentQuestion) {
            // Strip correct answer before sending
            const clientSideQuestion = {
                question: dailyQuiz.currentQuestion.question,
                options: dailyQuiz.currentQuestion.options
            };
            return res.status(200).json({ 
                status: "active", 
                question: clientSideQuestion,
                streak: dailyQuiz.streak 
            });
        }

        // 3. User hasn't completely generated a question today. Let's create one.
        // Get the topic they want to learn
        let topic = "General Knowledge";
        if (user.skillsToLearn && user.skillsToLearn.length > 0) {
            topic = user.skillsToLearn[0].name; // Just pick the first skill they want to learn
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are an expert quiz master. Generate exactly ONE Multiple Choice Question (MCQ) about "${topic}".
        Return ONLY a JSON object with this exact structure:
        {
          "question": "The question text goes here...",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 2,
          "explanation": "A short, 1-2 sentence informative explanation of the correct answer."
        }
        (where correctAnswer is the 0-indexed integer of the correct option). Do not include any HTML or markdown formatting in the response block.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let generatedQuestion = null;
        try {
            generatedQuestion = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse daily quiz JSON:", responseText);
            return res.status(500).json({ message: "Failed to generate a valid quiz question." });
        }

        // 4. Save the question to the user profile
        user.dailyQuiz = {
            ...dailyQuiz,
            lastGeneratedDate: today,
            currentQuestion: generatedQuestion
        };

        // If they missed yesterday and didn't attempt today, and their streak is active, break the streak?
        // Actually, let's keep it simple: streak breaks when they answer incorrectly, or they miss a day AND answer the next time. 
        // We'll calculate streak breaking right now if they open the quiz and they missed yesterday
        if (dailyQuiz.streak > 0 && dailyQuiz.lastAttemptDate && !isSameDay(dailyQuiz.lastAttemptDate, today) && !isYesterday(dailyQuiz.lastAttemptDate, today)) {
             user.dailyQuiz.streak = 0; // Streak broken because they didn't answer yesterday
        }

        await user.save();

        const clientSideQuestion = {
            question: generatedQuestion.question,
            options: generatedQuestion.options
        };

        res.status(200).json({ 
            status: "active", 
            question: clientSideQuestion,
            streak: user.dailyQuiz.streak 
        });

    } catch (error) {
        console.error("Error fetching daily quiz:", error);
        res.status(500).json({ message: "Internal server error while fetching quiz." });
    }
};

export const submitDailyQuiz = async (req, res) => {
    try {
        const userId = req.user?._id;
        const { answerIndex } = req.body;

        if (!userId) return res.status(401).json({ message: "Unauthorized request." });
        if (answerIndex === undefined || answerIndex === null) return res.status(400).json({ message: "Answer index is required." });

        const user = await User.findById(userId);
        if (!user || !user.dailyQuiz || !user.dailyQuiz.currentQuestion) {
            return res.status(404).json({ message: "No active question found. Please refresh." });
        }

        const today = new Date();
        const dailyQuiz = user.dailyQuiz;

        if (isSameDay(dailyQuiz.lastAttemptDate, today)) {
            return res.status(400).json({ message: "You have already answered a question today." });
        }

        const isCorrect = (answerIndex === dailyQuiz.currentQuestion.correctAnswer);

        // Update streak
        let newStreak = dailyQuiz.streak;

        if (isCorrect) {
             // If streak is 0, start it. If > 0, check if they answered yesterday
             if (dailyQuiz.lastAttemptDate && isYesterday(dailyQuiz.lastAttemptDate, today)) {
                 newStreak++;
             } else {
                 newStreak = 1; // Start a new streak
             }
        } else {
             newStreak = 0; // Broken streak
        }

        user.dailyQuiz.streak = newStreak;
        user.dailyQuiz.lastAttemptDate = today;
        await user.save();

        res.status(200).json({
            isCorrect,
            correctAnswer: dailyQuiz.currentQuestion.correctAnswer, 
            explanation: dailyQuiz.currentQuestion.explanation, // Send explanation
            streak: newStreak
        });

    } catch (error) {
        console.error("Error submitting daily quiz:", error);
        res.status(500).json({ message: "Internal server error while submitting quiz." });
    }
};
