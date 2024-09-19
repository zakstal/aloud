import { voices as voicesElevenLabs} from './voiceApis/elevenLabs/voices.js' 
import { voices as voicesMurph} from './voiceApis/murph/voices.js' 
import voiceAvatars from './voiceAvatars.json' 

export type Voice = {
    audioProvider: string,
    voiceId: String,
    name: String,
    gender: String,
    preview: String,
    original: any,
}

// TODO add audio provider id
const voicesMurphTransformed = voicesMurph.map(voice => {
    return {
        audioProvider: 'murph',
        voiceId: voice.voiceId,
        name: voice.displayName,
        gender: voice.gender,
        accent: voice.accent,
        age: voice.description,
        style: voice.availableStyles,
        avatar: voiceAvatars[voice.voiceId],
        preview: null,
        original: voice
    }
})

// TODO add audio provider id
const voicesElevenLabsTransformed = voicesElevenLabs.voices.map(voice => {
    return {
        audioProvider: 'elevenLabs',
        voiceId: voice.voice_id,
        name: voice.name,
        gender: voice.labels.gender,
        accent: voice.labels.accent,
        age: voice.labels.age,
            avatar: voiceAvatars[voice.voice_id],
        preview: voice.preview_url,
        style: [voice.labels.use_case],
        original: voice
    }
})


const voices = {
    elevenLabs: voicesElevenLabsTransformed,
    murph: voicesMurphTransformed,
    all: [].concat(voicesElevenLabsTransformed).concat(voicesMurphTransformed)
}

export default voices