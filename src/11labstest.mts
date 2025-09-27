// file: 11labstest.mts
import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

let voiceId = 'wJqPPQ618aTW29mptyoc'; // Judy default voice id

// Recreate __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const elevenlabs = new ElevenLabsClient();

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
                }
            };
        }
    };
}

export function updatevoice(voiceId: string) {
    voiceId = voiceId;
}

/**
 * Speak text using ElevenLabs TTS
 */
export async function speak(input: string) {

    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
        text: input,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
    });

    await play(streamToAsyncIterable(audio));
}
