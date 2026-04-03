import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

import fs from "fs";

async function testModel() {
    let output = "";
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await res.json();
        output = JSON.stringify(data, null, 2);
    } catch (err) {
        output += "Error fetching REST API:\n" + err.toString();
    }
    fs.writeFileSync("out.txt", output);
}




testModel();
