
import { ElevenLabsClient, ElevenLabs, play } from "elevenlabs";
import { createWriteStream } from "fs";


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
            const fileName = `./readings/${options.fileName}.mp3`;
            const fileStream = createWriteStream(fileName);
      
            audio.pipe(fileStream);
            fileStream.on("finish", () => resolve(audio)); // Resolve with the fileName
            fileStream.on("error", reject);

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