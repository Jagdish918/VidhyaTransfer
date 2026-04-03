import { GoogleGenerativeAI } from "@google/generative-ai";
import { Resource } from "../models/resource.model.js";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);



export const generateUnifiedRoadmap = async (req, res) => {
    try {
        const { skill, timeframe } = req.body;
        const userId = req.user?._id;

        if (!skill || !timeframe) {
            return res.status(400).json({ message: "Skill and timeframe are required." });
        }
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized request." });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }



        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `You are an expert curriculum designer. 
        Step 1: Analyze if the input "${skill}" is a valid skill, topic, or subject that can be learned or studied (e.g. Python, Chess, French, WWII History). If it's a random string, a specific person's name (like Virat Kohli) not related to a broader skill, nonsensical, or profanity, you MUST return an ERROR object.
        
        Step 2: If valid, extract a detailed, sequential learning roadmap for the skill "${skill}" to be completed in ${timeframe}.
        
        Return ONLY a JSON object. 
        If invalid, return: {"error": "The topic provided is not a valid skill or path that can be learned. Please enter a valid learning topic."}
        If valid, return a JSON array of topic objects. Each topic should have:
        - "title": (String)
        - "subtopics": (Array of Objects) with "title", "completed" (false), and "note" ("").

        Format for valid skill (JUST the array):
        [
          {
            "title": "Module 1",
            "subtopics": [{ "title": "Sub 1", "completed": false, "note": "" }]
          }
        ]
        
        Respond only with the raw JSON.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let roadmapData;
        try {
            roadmapData = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            return res.status(500).json({ message: "AI response was not valid JSON." });
        }

        // Check for AI validation error
        if (roadmapData.error) {
            return res.status(400).json({ message: roadmapData.error });
        }

        const savedResource = await Resource.create({
            userId,
            type: "roadmap",
            skill,
            timeframe,
            roadmapData
        });

        res.status(200).json({ data: savedResource });
    } catch (error) {
        console.error("Error generating roadmap:", error);
        res.status(500).json({ message: "Failed to generate roadmap." });
    }
};

export const completeWholeTopic = asyncHandler(async (req, res) => {
    try {
        const { resourceId, topicIndex } = req.body;
        const userId = req.user?._id;

        if (!resourceId || topicIndex === undefined) {
            return res.status(400).json({ message: "Missing required parameters." });
        }

        const resource = await Resource.findOne({ _id: resourceId, userId });
        if (!resource) return res.status(404).json({ message: "Resource not found." });

        if (resource.roadmapData && resource.roadmapData[topicIndex]) {
            resource.roadmapData[topicIndex].subtopics.forEach(sub => {
                sub.completed = true;
            });
        }

        resource.markModified('roadmapData');
        await resource.save();

        res.status(200).json({ roadmapData: resource.roadmapData });
    } catch (error) {
        console.error("Error completing topic:", error);
        res.status(500).json({ message: "Failed to complete topic." });
    }
});

export const generateSubtopicNote = async (req, res) => {
    try {
        const { resourceId, topicIndex, subtopicIndex, mainSkill, subtopicTitle } = req.body;
        const userId = req.user?._id;

        if (!resourceId || topicIndex === undefined || subtopicIndex === undefined || !mainSkill || !subtopicTitle) {
            return res.status(400).json({ message: "Missing required parameters." });
        }

        const resource = await Resource.findOne({ _id: resourceId, userId });
        if (!resource) return res.status(404).json({ message: "Resource not found." });

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are an expert tutor. Create a highly detailed, comprehensive learning note specifically about "${subtopicTitle}" within the broader context of "${mainSkill}". Use markdown formatting. Include sections for an Introduction, Key Concepts, and a Summary. 
        CRITICAL RULE: Only include a "Code Examples" section if "${mainSkill}" is strictly related to software programming or coding (e.g., Python, React, JavaScript). For non-programming topics (like Chess, Cooking, History, etc.), DO NOT include any code blocks or Code Examples section at all.`;

        const result = await model.generateContent(prompt);
        const noteText = result.response.text();

        // Save generated note back to the document
        resource.roadmapData[topicIndex].subtopics[subtopicIndex].note = noteText;

        // Mongoose needs us to explicitly mark mixed/object properties as modified
        resource.markModified('roadmapData');
        await resource.save();

        res.status(200).json({ note: noteText, roadmapData: resource.roadmapData });
    } catch (error) {
        console.error("Error generating subtopic note:", error);
        res.status(500).json({ message: "Failed to generate note." });
    }
};


export const updateSubtopicProgress = async (req, res) => {
    try {
        const { resourceId, topicIndex, subtopicIndex, completed } = req.body;
        const userId = req.user?._id;

        if (!resourceId || topicIndex === undefined || subtopicIndex === undefined) {
            return res.status(400).json({ message: "Missing required parameters." });
        }

        const resource = await Resource.findOne({ _id: resourceId, userId });
        if (!resource) return res.status(404).json({ message: "Resource not found." });

        resource.roadmapData[topicIndex].subtopics[subtopicIndex].completed = completed;
        resource.markModified('roadmapData');
        await resource.save();

        res.status(200).json({ roadmapData: resource.roadmapData });
    } catch (error) {
        console.error("Error updating progress:", error);
        res.status(500).json({ message: "Failed to update progress." });
    }
}

export const generateFinalTest = async (req, res) => {
    try {
        const { resourceId } = req.body;
        const userId = req.user?._id;

        if (!resourceId) return res.status(400).json({ message: "Resource ID required." });

        const resource = await Resource.findOne({ _id: resourceId, userId });
        if (!resource) return res.status(404).json({ message: "Resource not found." });

        if (resource.testData && resource.testData.status !== "locked" && resource.testData.status !== "ready") {
            return res.status(400).json({ message: "Test already in progress or completed." });
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Determine if technical or not based on skill string (simple heuristic, better to let AI decide)
        const prompt = `You are an expert examiner. Create a final assessment test for a student who has just completed a learning roadmap on "${resource.skill}".
        
        Rules:
        1. Generate exactly 10 Multiple Choice Questions (MCQs).
        2. CRITICAL: Analyze if the topic "${resource.skill}" is strictly related to software programming, coding, or web development (e.g., Python, React, Java). If it is strictly programming-related, generate exactly 2 Coding/Practical questions. If the topic is non-programming (e.g., Chess, Cooking, History, Math, Soft Skills), you MUST return an empty array [] for coding questions. DO NOT generate coding questions for non-programming topics.
        3. All questions must be STRICTLY related to the foundational concepts of "${resource.skill}".
        
        Return ONLY a JSON object with this exact structure:
        {
           "mcqs": [
              {
                 "id": 1,
                 "question": "What is...?",
                 "options": ["A", "B", "C", "D"],
                 "correctAnswer": 0
              }
           ],
           "coding": [
              {
                 "id": 11,
                 "question": "Write a function that..."
              }
           ]
        }
        Do not include markdown blocks, just raw JSON.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        let generatedQuestions = {};
        try {
            generatedQuestions = JSON.parse(responseText);
        } catch (e) {
            console.error("Failed to parse Gemini JSON:", responseText);
            return res.status(500).json({ message: "AI response was not valid JSON." });
        }

        // Lock test and save generated questions mentally - but wait, we need to hide the answers from the frontend payload!
        // We will store the original in DB but send a stripped version to the user.

        resource.testData = {
            status: "in_progress",
            questions: generatedQuestions, // includes correct answers internally
            startedAt: new Date(),
            score: null,
            analytics: ""
        };

        resource.markModified('testData');
        await resource.save();

        // Strip correct answers before sending
        const safeData = {
            mcqs: generatedQuestions.mcqs.map(q => ({ id: q.id, question: q.question, options: q.options })),
            coding: generatedQuestions.coding
        };

        res.status(200).json({ test: safeData });
    } catch (error) {
        console.error("Error generating final test:", error);
        res.status(500).json({ message: "Failed to generate test." });
    }
};

export const submitFinalTest = async (req, res) => {
    try {
        const { resourceId, answers } = req.body;
        // answers format: { "mcqs": { "1": 0, "2": 2 }, "coding": { "11": "const x = 5;" } }
        const userId = req.user?._id;

        if (!resourceId || !answers) return res.status(400).json({ message: "Resource ID and answers required." });

        const resource = await Resource.findOne({ _id: resourceId, userId });
        if (!resource) return res.status(404).json({ message: "Resource not found." });

        const testUser = await User.findById(userId);
        if (!testUser) {
            return res.status(404).json({ message: "User not found." });
        }

        if (resource.testData.status !== "in_progress") {
            return res.status(400).json({ message: "Test is not in progress." });
        }

        const questionsData = resource.testData.questions[0] || resource.testData.questions; // Handle mongoose array vs object weirdness if nested
        const originalQuestions = Array.isArray(resource.testData.questions) ? resource.testData.questions[0] : resource.testData.questions;


        // Calculate MCQ Score immediately
        let mcqCorrect = 0;
        let totalMcq = 0;

        if (originalQuestions && originalQuestions.mcqs) {
            totalMcq = originalQuestions.mcqs.length;
            originalQuestions.mcqs.forEach(q => {
                if (answers.mcqs && answers.mcqs[q.id] === q.correctAnswer) {
                    mcqCorrect++;
                }
            });
        }

        // Evaluate Coding via AI
        let codingFeedback = "";
        let codingScore = 0;
        const totalCoding = (originalQuestions && originalQuestions.coding) ? originalQuestions.coding.length : 0;

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        if (totalCoding > 0) {
            const prompt = `You are a strict examiner. Evaluate these coding answers for a test on "${resource.skill}".
            
            Original Questions:
            ${JSON.stringify(originalQuestions.coding)}
            
            Student Answers:
            ${JSON.stringify(answers.coding)}
            
            Provide a brief, constructive feedback paragraph. Then, rate the overall coding performance out of ${totalCoding} points (give integer points for basically correct approaches).
            Format the response exactly like this:
            FEEDBACK: [your paragraph here]
            SCORE: [integer]`;

            const result = await model.generateContent(prompt);
            const text = result.response.text();

            const scoreMatch = text.match(/SCORE:\s*(\d+)/);
            if (scoreMatch) {
                codingScore = parseInt(scoreMatch[1]);
            }
            const feedbackMatch = text.match(/FEEDBACK:\s*(.*)/);
            if (feedbackMatch) {
                codingFeedback = feedbackMatch[1];
            }
        }

        const totalEarned = mcqCorrect + codingScore;
        const totalPossible = totalMcq + totalCoding;
        const finalScorePercent = Math.round((totalEarned / totalPossible) * 100) || 0;

        const refundCredits = Math.round((finalScorePercent / 100) * 10);
        testUser.credits += refundCredits;
        await testUser.save();

        let finalAnalytics = `**MCQ Score:** ${mcqCorrect}/${totalMcq}\n`;
        if (totalCoding > 0) {
            finalAnalytics += `**Coding Score:** ${codingScore}/${totalCoding}\n`;
            finalAnalytics += `**Coding Feedback:** ${codingFeedback}\n`;
        }

        if (finalScorePercent > 80) finalAnalytics += "\n\n**Verdict:** Excellent! You have thoroughly mastered this roadmap.";
        else if (finalScorePercent > 60) finalAnalytics += "\n\n**Verdict:** Good job! You have a solid grasp but might want to review a few weaker points.";
        else finalAnalytics += "\n\n**Verdict:** Keep studying. It is recommended to re-read the AI notes for sections you struggled with.";

        finalAnalytics += `\n\n**Credits Refunded:** You earned back ${refundCredits} credits based on your score of ${finalScorePercent}%!`;

        resource.testData.status = "completed";
        resource.testData.score = finalScorePercent;
        resource.testData.analytics = finalAnalytics;

        resource.markModified('testData');
        await resource.save();

        res.status(200).json({
            score: finalScorePercent,
            analytics: finalAnalytics,
            refundedCredits: refundCredits
        });

    } catch (error) {
        console.error("Error submitting final test:", error);
        res.status(500).json({ message: "Failed to submit test." });
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
