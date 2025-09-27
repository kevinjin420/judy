// file: 11labstest.mts
import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';
const elevenlabs = new ElevenLabsClient();
/**
 * Convert ReadableStream to AsyncIterable for play()
 */
function streamToAsyncIterable(stream) {
    const reader = stream.getReader();
    return {
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    const { done, value } = await reader.read();
                    if (done) {
                        return { done: true, value: undefined };
                    }
                    return { done: false, value };
                }
            };
        }
    };
}
/**
 * Speak text using ElevenLabs TTS
 */
export async function speak(input) {
    const voiceId = 'O4cGUVdAocn0z4EpQ9yF'; // hard-coded for now
    const audio = await elevenlabs.textToSpeech.convert(voiceId, {
        text: input,
        modelId: 'eleven_multilingual_v2',
        outputFormat: 'mp3_44100_128',
    });
    await play(streamToAsyncIterable(audio));
}
