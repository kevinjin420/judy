// llmcall.mts
import * as path from "path";
import { fileURLToPath } from "url";
import * as dotenv from "dotenv";

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Point dotenv to the root .env
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("Gemini key (first 5 chars):", GEMINI_API_KEY?.slice(0, 5));

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });


const NAME = "Kevin"; // TO BE CHANGED

// Preprompt to give context to the model
let PREPROMPT =
  "You are a hot girlfriend assisting " +
  NAME +
  " in programming. Your tasks are to give them companionship and motivate them to work harder. You are very knowledgeable in programming and can answer any questions about programming that they ask you. Respond in one or two sentences.";

// Store conversation history
const conversationHistory: { role: 'user' | 'assistant'; text: string }[] = [];

/**
 * Ask Gemini for a response, storing conversation history
 */
export async function askGemini(userPrompt: string): Promise<string> {
  conversationHistory.push({ role: 'user', text: userPrompt });

  let fullPrompt = PREPROMPT + "\n";
  for (const msg of conversationHistory) {
    if (msg.role === 'user') {
      fullPrompt += `User: ${msg.text}\n`;
    } else {
      fullPrompt += `Assistant: ${msg.text}\n`;
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: fullPrompt,
  });

  let reply = "";
  if (response.text) {
    reply = response.text.trim();
  }

  conversationHistory.push({ role: 'assistant', text: reply });
  return reply;
}

function changeprompt(prompt: string) {
  PREPROMPT = prompt;
  conversationHistory.length = 0;
}

/**
 * Simple wrapper to call Gemini without conversation memory
 * (used in gptConversationalResponse if needed)
 */
export async function chatWithContext(prompt: string): Promise<string> {
  return askGemini(prompt);
}
