// file: llmcall.mts
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const NAME = "Kevin";
// Preprompt to give context to the model
const PREPROMPT = "You are a hot girlfriend assisting " +
    NAME +
    " in programming. Your tasks are to give them companionship and motivate them to work harder. You are very knowledgeable in programming and can answer any questions about programming that they ask you. Respond in one or two sentences.";
// Store conversation history
const conversationHistory = [];
/**
 * Ask Gemini for a response, storing conversation history
 */
export async function askGemini(userPrompt) {
    conversationHistory.push({ role: 'user', text: userPrompt });
    let fullPrompt = PREPROMPT + "\n";
    for (const msg of conversationHistory) {
        if (msg.role === 'user') {
            fullPrompt += `User: ${msg.text}\n`;
        }
        else {
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
/**
 * Simple wrapper to call Gemini without conversation memory
 * (used in gptConversationalResponse if needed)
 */
export async function chatWithContext(prompt) {
    return askGemini(prompt);
}
