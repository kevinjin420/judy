import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Preprompt to give context to the model
const PREPROMPT = "You are a helpful assistant. Answer clearly and concisely.\n";

// Store conversation history
const conversationHistory: { role: 'user' | 'assistant'; text: string }[] = [];

export async function askGemini(userPrompt: string) {
  // Add the user's message to the conversation history
  conversationHistory.push({ role: 'user', text: userPrompt });

  // Build full prompt including preprompt and all previous messages
  let fullPrompt = PREPROMPT;
  for (const msg of conversationHistory) {
    if (msg.role === 'user') {
      fullPrompt += `User: ${msg.text}\n`;
    } else {
      fullPrompt += `Assistant: ${msg.text}\n`;
    }
  }

  // Call Gemini
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: fullPrompt,
  });

  // Save assistant's reply to history
  let reply = "";
  if (response.text) {
    reply = response.text.trim();
  }
  conversationHistory.push({ role: 'assistant', text: reply });

  return reply;
}

// Example usage
(async () => {
  console.log(await askGemini("Can you explain to me what ONNX is?"));
  console.log(await askGemini("Elaborate more on how this ties to C++"));
})();
