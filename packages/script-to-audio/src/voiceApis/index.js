import { textToSpeech as textToSpeechMurph  } from "./murph/murph";
import { textToSpeechWithTimeStamps as textToSpeechElevent  } from "./elevenLabs/elevenLabs";

export default {
    murph: textToSpeechMurph,
    elevenLabs: textToSpeechElevent
}