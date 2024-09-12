import * as dotenv from "dotenv";

dotenv.config();

const MURPH_API_KEY = process.env.MURPH_API_KEY;
/**
Exmaple response:
{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwcml2YXRlVm9pY2VJZHMiOiIiLCJlZmZlY3RpdmVVaWQiOiJXT1JLU1BBQ0VJRDAxNzI1NjYyMDIzMDMzOFFWIiwiYXBpS2V5IjoiYXBpX2MyZmY3ODUwLTFjZDUtNGU3Yy1iMDAxLTNlZmQ1Yzg2N2I3MSIsImhvdXIiOjQ3OTQzOSwiaXNzIjoiTVVSRiIsInVzZXJDcmVhdGVkQXQiOjE3MjU2NjIwMjMwMzQsImV4cCI6MTcyNTk4Mzg5OH0.OeQqRIEjw7a2gXANBzQwd4_iMA7xr3yNmoGCnyOaKqg",
    "expiryInEpochMillis": 1725983898326
}
 */
let tokenObj = null
async function getToken() {
    if (tokenObj && tokenObj.expiryInEpochMillis < Date.now()) return tokenObj.token

    const res = await fetch('https://api.murf.ai/v1/auth/token', {
        headers: {
            'api-key': MURPH_API_KEY
        }
    })

    if (res.ok) {
        const json = await res.json()
        tokenObj = json
        return tokenObj.token
    } 

}

async function fetchWithToken(url, obj) {
    const token = await getToken()
    const headers = obj?.headers || {}

    return fetch(url, {
        ...obj,
        headers: {
            'token': token,
            'Content-Type': 'application/json',
            ...headers
        }
    })
}


/**
 curl --request GET \
    --header "token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJwcml2YXRlVm9pY2VJZHMiOiIiLCJlZmZlY3RpdmVVaWQiOiJXT1JLU1BBQ0VJRDAxNzI1NjYyMDIzMDMzOFFWIiwiYXBpS2V5IjoiYXBpX2MyZmY3ODUwLTFjZDUtNGU3Yy1iMDAxLTNlZmQ1Yzg2N2I3MSIsImhvdXIiOjQ3OTQzOSwiaXNzIjoiTVVSRiIsInVzZXJDcmVhdGVkQXQiOjE3MjU2NjIwMjMwMzQsImV4cCI6MTcyNTk4Mzg5OH0.OeQqRIEjw7a2gXANBzQwd4_iMA7xr3yNmoGCnyOaKqg" \
    --url "https://api.murf.ai/v1/speech/voices"

    [
        {
            "voiceId": "en-UK-hazel",
            "displayName": "Hazel (F)",
            "locale": "en-UK",
            "displayLanguage": "English",
            "accent": "UK",
            "description": "Young Adult",
            "gender": "Female",
            "availableStyles": [
                "Conversational"
            ]
        },
        {
            "voiceId": "en-US-cooper",
            "displayName": "Cooper (M)",
            "locale": "en-US",
            "displayLanguage": "English",
            "accent": "US & Canada",
            "description": "Young Adult",
            "gender": "Male",
            "availableStyles": [
                "Conversational",
                "Promo",
                "Angry",
                "Inspirational",
                "Sad",
                "Newscast"
            ]
        },
        ...
    ]
    
 */

export async function voices() {
    const res = await fetchWithToken('https://api.murf.ai/v1/speech/voices')
    const json = await res.json()

    if (res.ok) {
        return json
    } 
}


/**
 * 
 * 

example response:
{
    "audioFile": "https://murf.ai/user-upload/one-day-temp/23724ea2-80c8-48ec-8257-e3791994645e.wav?response-cache-control=max-age%3D604801&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20240910T000000Z&X-Amz-SignedHeaders=host&X-Amz-Expires=259200&X-Amz-Credential=AKIA27M5532DYKBCJICE%2F20240910%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Signature=465fe1e13c57489774242529c853f4b4734df5a9efce596950d27f46d8eebd38",
    "encodedAudio": null,
    "audioLengthInSeconds": 1.358186,
    "wordDurations": [
        {
            "sourceWordIndex": null,
            "word": "Testing",
            "startMs": 0,
            "endMs": 499,
            "pitchScaleMinimum": 0,
            "pitchScaleMaximum": 0
        },
        {
            "sourceWordIndex": null,
            "word": "voice",
            "startMs": 499,
            "endMs": 696,
            "pitchScaleMinimum": 0,
            "pitchScaleMaximum": 0
        },
        {
            "sourceWordIndex": null,
            "word": "api",
            "startMs": 696,
            "endMs": 1346,
            "pitchScaleMinimum": 0,
            "pitchScaleMaximum": 0
        },
        {
            "sourceWordIndex": null,
            "word": "!",
            "startMs": 1346,
            "endMs": 1358,
            "pitchScaleMinimum": 0,
            "pitchScaleMaximum": 0
        }
    ],
    "warning": null,
    "consumedCharacterCount": 18,
    "remainingCharacterCount": 49982
}
 */

export async function textToSpeech(text, config = {}) {
    // TODO limit what can be sent in the config
    const body = Object.assign({}, {
        voiceId: "en-UK-hazel",
        // format: "WAV",
        format: "MP3",
        channelType: "MONO",
        sampleRate: 24000,
        modelVersion: "GEN2",
        text
    }, config)

    const bodyText = JSON.stringify(body)

    try {

        const res = await fetchWithToken('https://api.murf.ai/v1/speech/generate', {
            method: 'POST',
            body: bodyText
        })
        
        const json = await res.json()

        if (res.ok) {
            return await json
        } else {
            throw json
        }
    } catch (e) {
        console.log('e', e)
    }
}



