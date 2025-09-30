import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import { ElevenLabsClient, play } from "@elevenlabs/elevenlabs-js";

// Recreate __dirname in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

console.log("[JudyAI Debug] Gemini API Key configured:", !!GEMINI_API_KEY);
console.log(
	"[JudyAI Debug] ElevenLabs API Key configured:",
	!!ELEVENLABS_API_KEY
);

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const elevenlabs = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

// Store conversation history
const conversationHistory: { role: "user" | "model"; text: string }[] = [];

// Voice ID and system prompt - configured per character
let voiceId = "zmcVlqmyk3Jpn5AVYcAL"; // Default voice id
let systemPrompt = "You are a helpful AI assistant."; // Default system prompt

/**
 * Convert ReadableStream to AsyncIterable for play()
 */
function streamToAsyncIterable(stream: ReadableStream<Uint8Array>) {
	const reader = stream.getReader();
	return {
		[Symbol.asyncIterator]() {
			return {
				async next(): Promise<IteratorResult<Uint8Array>> {
					const { done, value } = await reader.read();
					if (done) {
						return { done: true, value: undefined as any };
					}
					return { done: false, value };
				},
			};
		},
	};
}
/**
 * Ask Gemini for a response, storing conversation history
 * Automatically retries on 503 errors (model overloaded)
 */
export async function askGemini(userPrompt: string): Promise<string> {
  conversationHistory.push({ role: "user", text: userPrompt });

  // Build structured messages - prepend system prompt to first user message
  const contents = conversationHistory.map((msg, index) => {
    if (msg.role === "user" && index === 0) {
      // Prepend system prompt to first user message
      return {
        role: "user",
        parts: [{ text: systemPrompt + "\n\n" + msg.text }],
      };
    }
    return {
      role: msg.role === "user" ? "user" : "model",
      parts: [{ text: msg.text }],
    };
  });

  const maxRetries = 3;
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        "[JudyAI Debug] Sending request to Gemini (attempt",
        attempt,
        "of",
        maxRetries,
        ")"
      );

      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-001",
        contents,
      });

      let reply = "";
      if (response.text) {
        reply = response.text.trim();
      }

      // Store as "model" not "assistant" so she isn't locked into that role
      conversationHistory.push({ role: "model", text: reply });
      console.log("[JudyAI Debug] Gemini request succeeded");
      return reply;
    } catch (error: any) {
      lastError = error;
      const is503 =
        error?.message?.includes("503") ||
        error?.message?.includes("overloaded") ||
        error?.message?.includes("UNAVAILABLE");

      if (is503 && attempt < maxRetries) {
        const waitTime = attempt * 1000; // 1s, 2s, 3s...
        console.log(
          "[JudyAI Debug] Gemini model overloaded, retrying in",
          waitTime,
          "ms..."
        );
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      } else if (!is503) {
        // Non-503 error, don't retry
        break;
      }
    }
  }

  // All retries failed
  console.error(
    "[JudyAI Debug] Gemini request failed after",
    maxRetries,
    "attempts:",
    lastError
  );
  throw lastError;
}


/**
 * Get audio duration from MP3 buffer using first frame header
 */
function getMP3Duration(buffer: Uint8Array): number {
	try {
		// Look for MP3 frame sync (0xFF 0xFB or 0xFF 0xFA)
		for (let i = 0; i < Math.min(buffer.length - 4, 1000); i++) {
			if (buffer[i] === 0xff && (buffer[i + 1] & 0xe0) === 0xe0) {
				const mpegVersion = (buffer[i + 1] & 0x18) >> 3;
				const layer = (buffer[i + 1] & 0x06) >> 1;
				const bitrate = (buffer[i + 2] & 0xf0) >> 4;
				const sampleRate = (buffer[i + 2] & 0x0c) >> 2;

				// Bitrate table for MPEG1 Layer3 (MP3)
				const bitrateTable = [
					0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256,
					320,
				];
				const sampleRateTable = [44100, 48000, 32000];

				const bitrateValue = bitrateTable[bitrate] * 1000;
				const sampleRateValue = sampleRateTable[sampleRate];

				if (bitrateValue > 0 && sampleRateValue > 0) {
					// Calculate approximate duration: (file size * 8) / bitrate
					const durationSeconds = (buffer.length * 8) / bitrateValue;
					console.log(
						"[JudyAI Debug] Calculated MP3 duration:",
						durationSeconds.toFixed(2),
						"seconds"
					);
					return durationSeconds * 1000; // Convert to milliseconds
				}
			}
		}
	} catch (error) {
		console.warn("[JudyAI Debug] Could not parse MP3 duration:", error);
	}

	// Fallback: estimate based on file size (rough approximation for 128kbps MP3)
	const estimatedDuration = ((buffer.length * 8) / 128000) * 1000;
	console.log(
		"[JudyAI Debug] Using fallback duration estimate:",
		estimatedDuration.toFixed(2),
		"ms"
	);
	return estimatedDuration;
}

/**
 * Speak text using ElevenLabs TTS (Flash v2.5 model) and return actual audio duration
 *
 * Speed settings:
 * - 0.7 = slowest
 * - 0.8 = noticeably slower (default)
 * - 0.9 = slightly slower
 * - 1.0 = normal speed
 * - 1.1 = slightly faster
 * - 1.2 = fastest
 */
export async function speakWithDuration(
	input: string,
	speedRate: number = 0.9
): Promise<number> {
	try {
		console.log(
			"[JudyAI Debug] Starting speech synthesis for text:",
			input.substring(0, 50) + "..."
		);
		console.log("[JudyAI Debug] Using voice ID:", voiceId);
		console.log("[JudyAI Debug] Speech speed rate:", speedRate);

		const audio = await elevenlabs.textToSpeech.convert(voiceId, {
			text: input,
			modelId: "eleven_flash_v2_5",
			outputFormat: "mp3_44100_128",
			voiceSettings: {
				stability: 0.5,
				similarityBoost: 0.75,
				style: 0.0,
				useSpeakerBoost: true,
				speed: speedRate,
			},
		});

		console.log(
			"[JudyAI Debug] Audio stream received, collecting audio data..."
		);

		// Collect the entire audio stream into a buffer
		const chunks: Uint8Array[] = [];
		const reader = audio.getReader();

		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			chunks.push(value);
		}

		// Combine all chunks into a single buffer
		const totalLength = chunks.reduce(
			(acc, chunk) => acc + chunk.length,
			0
		);
		const audioBuffer = new Uint8Array(totalLength);
		let offset = 0;
		for (const chunk of chunks) {
			audioBuffer.set(chunk, offset);
			offset += chunk.length;
		}

		console.log(
			"[JudyAI Debug] Audio collected, size:",
			audioBuffer.length,
			"bytes"
		);

		// Get actual duration from the audio
		const duration = getMP3Duration(audioBuffer);

		// Play the audio
		console.log("[JudyAI Debug] Starting playback...");
		await play(
			streamToAsyncIterable(
				new ReadableStream({
					start(controller) {
						controller.enqueue(audioBuffer);
						controller.close();
					},
				})
			)
		);
		console.log("[JudyAI Debug] Playback completed");

		return duration;
	} catch (error) {
		console.error("[JudyAI Debug] Error during speech synthesis:", error);
		throw error;
	}
}

/**
 * Configure character settings (system prompt and voice)
 */
export function configureCharacter(
	newSystemPrompt: string,
	newVoiceId: string
): void {
	systemPrompt = newSystemPrompt;
	voiceId = newVoiceId;
	conversationHistory.length = 0; // Clear history when switching characters
}
