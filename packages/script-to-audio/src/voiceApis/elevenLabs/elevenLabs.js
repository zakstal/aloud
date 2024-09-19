
import { ElevenLabsClient, ElevenLabs, play } from "elevenlabs";
import fs from "fs";
import ffprobe  from 'ffprobe-client';
const createWriteStream = fs.createWriteStream

import * as dotenv from "dotenv";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });



export async function textToSpeech(text, options = {}) {

    return new Promise(async (resolve, reject) => {
        try {
            
            const voiceId = options.voiceId
            const audio = await client.textToSpeech.convert(voiceId, {
                optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
                output_format: ElevenLabs.OutputFormat.Mp32205032,
                text,
                // text: "It sure does, Jackie\u2026 My mama always said: \u201CIn Carolina, the air's so thick you can wear it!\u201D",
                voice_settings: {
                    stability: 0.1,
                    similarity_boost: 0.3,
                    style: 0.2
                }
            });
            const fileName = options.fileName;
            const fileStream = createWriteStream(fileName);
      
            audio.pipe(fileStream);
            fileStream.on("finish", async () => {
                const lengthInSeconds = await ffprobe(url);
                resolve({ audioLengthInSeconds: lengthInSeconds })
            }); // Resolve with the fileName
            fileStream.on("error", reject);

            // return audio
        } catch (e) {
            reject(e);
        }
    })
}

/**
 * 
 * @param {*} text 
 * @param {*} options 
 * @returns 
 * 
 * exampl response:
 * {
  audio_base64: '//NAxAAKmAJS...',
  alignment: {
    characters: [
      ' ', ' ', ' ', ' ', ' ', ' ',
      ' ', ' ', ' ', ' ', ' ', ' ',
      ' ', ' ', ' ', ' ', ' ', 'B',
      'A', 'R', 'B', 'E', 'R', 'S',
      'H', 'O', 'P', ' ', 'W', 'A',
      'R', 'S'
    ],
    character_start_times_seconds: [
          0, 0.116, 0.116, 0.116, 0.116,
      0.116, 0.116, 0.116, 0.116, 0.116,
      0.116, 0.116, 0.116, 0.116, 0.116,
      0.116, 0.116, 0.116, 0.186, 0.232,
      0.279, 0.337, 0.383, 0.406, 0.464,
      0.511, 0.557, 0.615, 0.673, 0.708,
      0.766, 0.824
    ],
    character_end_times_seconds: [
      0.116, 0.116, 0.116, 0.116,
      0.116, 0.116, 0.116, 0.116,
      0.116, 0.116, 0.116, 0.116,
      0.116, 0.116, 0.116, 0.116,
      0.116, 0.186, 0.232, 0.279,
      0.337, 0.383, 0.406, 0.464,
      0.511, 0.557, 0.615, 0.673,
      0.708, 0.766, 0.824, 0.975
    ]
  },
  normalized_alignment: {
    characters: [
      ' ', 'B', 'A', 'R', 'B',
      'E', 'R', 'S', 'H', 'O',
      'P', ' ', 'W', 'A', 'R',
      'S', ' '
    ],
    character_start_times_seconds: [
          0, 0.116, 0.186,
      0.232, 0.279, 0.337,
      0.383, 0.406, 0.464,
      0.511, 0.557, 0.615,
      0.673, 0.708, 0.766,
      0.824, 0.871
    ],
    character_end_times_seconds: [
      0.116, 0.186, 0.232,
      0.279, 0.337, 0.383,
      0.406, 0.464, 0.511,
      0.557, 0.615, 0.673,
      0.708, 0.766, 0.824,
      0.871, 0.975
    ]
  }
}

 */
export async function textToSpeechWithTimeStamps(text, options = {}) {

    return new Promise(async (resolve, reject) => {
        try {
            
            const voiceId = options.voiceId
            const audio = await client.textToSpeech.convertWithTimestamps(voiceId, {
                optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
                output_format: ElevenLabs.OutputFormat.Mp32205032,
                text,
                // text: "It sure does, Jackie\u2026 My mama always said: \u201CIn Carolina, the air's so thick you can wear it!\u201D",
                voice_settings: {
                    stability: 0.1,
                    similarity_boost: 0.3,
                    style: 0.2
                }
            });
            const fileName = options.fileName;
            const audioBuffer = Buffer.from(audio.audio_base64, 'base64')

            fs.writeFileSync(fileName, audioBuffer)
            resolve({ 
                audioLengthInSeconds: audio.normalized_alignment.character_end_times_seconds[audio.normalized_alignment.character_end_times_seconds.length - 1],
                original: audio
            })

            // return audio
        } catch (e) {
            reject(e);
        }
    })
}


/**
 
curl --request GET \
--url https://api.elevenlabs.io/v1/voices/pMsXgVXv3BLzUgSXRplE \
--header "xi-api-key:sk_ab5e4f3b2331468d4baf6e7c77978a4192999d16a748935c"
*/