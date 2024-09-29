import { textToSpeech as textToSpeechMurph  } from "./murph/murph.ts";
import { textToSpeechWithTimeStamps as textToSpeechElevent  } from "./elevenLabs/elevenLabs.ts";

export default {
    murph: textToSpeechMurph,
    elevenLabs: textToSpeechElevent
}