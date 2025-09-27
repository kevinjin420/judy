// file: driver.mts
import fs from "fs/promises";
import { askGemini } from "./llmcall.ts"; // Gemini conversation memory
import { speak } from "./11labstest.ts";              // ElevenLabs TTS function

/**
 * Ask Gemini for a conversational response that may include code.
 * Abstracted: relies on chatWithContext for ongoing memory.
 *
 * @param prompt - User input or question
 * @returns { text: string, code?: string }
 */
export async function gptConversationalResponse(prompt: string) {
  const reply = await chatWithContext(`User prompt: ${prompt}`);

  try {
    const { text } = JSON.parse(reply);
    return { text };
  } catch {
    return { text: reply };
  }
}

/**
 * Main driver: gets Gemini response, speaks it, saves code if present.
 */
export async function runDriver(prompt: string) {
  const text = await askGemini(prompt);

  console.log("Gemini says:\n", text);

  await speak(text);
}

// Example usage from CLI
if (process.argv[2]) {
  runDriver(process.argv.slice(2).join(" ")).catch(console.error);
} else {
  console.log('Usage: node --loader ts-node/esm driver.mts "Your prompt here"');
}
