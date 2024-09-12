import { ElevenLabsClient, ElevenLabs, play } from "elevenlabs";


async function run() {

    const client = new ElevenLabsClient({ apiKey: 'sk_ab5e4f3b2331468d4baf6e7c77978a4192999d16a748935c' });
    const voiceId = "pMsXgVXv3BLzUgSXRplE"
    const audio = await client.textToSpeech.convert(voiceId, {
        optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
        output_format: ElevenLabs.OutputFormat.Mp32205032,
        text: "It sure does, Jackie\u2026 My mama always said: \u201CIn Carolina, the air's so thick you can wear it!\u201D",
        voice_settings: {
            stability: 0.1,
            similarity_boost: 0.3,
            style: 0.2
        }
    });

    // const text = await res.text()

    console.log("after request")
    await play(audio)
}

run()