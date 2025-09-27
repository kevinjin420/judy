import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';
import 'dotenv/config';

const elevenlabs = new ElevenLabsClient();

export async function speak(input: string) {
  const voiceId = 'O4cGUVdAocn0z4EpQ9yF' // HARD CODED FOR NOW
  const audio = await elevenlabs.textToSpeech.convert(voiceId, {
    text: input,
    modelId: 'eleven_multilingual_v2',
    outputFormat: 'mp3_44100_128',
  });
  await play(audio);
}

