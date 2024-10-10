import { Fountain } from 'fountain-js';
import { ElevenLabsClient, ElevenLabs, play } from "elevenlabs";
import voices from '../voices.json' assert { type: "json" }
import { createWriteStream } from "fs";
import { v4 as uuid } from "uuid";
import fs from 'fs'
import Path from 'path'
import url from 'url';
import { Readable } from 'stream';
import audioconcat from'audioconcat'

import * as dotenv from "dotenv";

dotenv.config();

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

const text = `
TRISH
Did you get my text?
BILL
You know the whole virus thing is
over...

TRISH

She’s planning on introducing you
to her new guy --
(beat)
They have shows coming up.

BILL
What time?

TRISH

After lunch, she wants you to see
the new routine.
BILL

What?
Pulling down the mask.
TRISH

She wants you to see the new
routine.
BILL
Oh, okay.
TRISH

You heard me the first time didn’t
you --
(beat)
I need my weed whacker back, is it
still working?
BILL
(loud, at Malcolm)
How’s it looking? That block get
loose?

2.

3.

TRISH

Is it working? Or did you break
that too?
BILL

It’s working, needs some oil.

TRISH

You know, your approval means
something to her.

CHARLIE (O.S.)
(shouting)
How you doin’ there Trish?`;
// const text = `INT. COFFEE SHOP - DAY
// A bustling coffee shop filled with the aroma of freshly brewed coffee and the chatter of patrons. SARAH, a 30-year-old writer with messy hair and ink-stained fingers, sits at a corner table, furiously typing on her laptop.

// JOHN, a handsome barista in his mid-20s, approaches with a steaming mug.

// JOHN
// Your usual, Sarah. Extra shot, no foam.

// Sarah looks up, startled.

// SARAH
// Oh, thanks John. You're a lifesaver.

// JOHN
// (smiling)
// No problem. How's the new novel coming along?

// SARAH
// (sighing)
// Slowly. Very slowly. I think my characters are plotting against me.

// JOHN
// (laughs)
// Well, if they stage a revolt, I've got your back. And plenty of caffeine.

// Sarah grins and takes a sip of her coffee.

// SARAH
// You're officially my favorite person right now.

// John winks and walks away. Sarah turns back to her laptop, a small smile playing on her lips as she begins to type again.

// FADE OUT.
// `;
        
let fountain = new Fountain();

let output = fountain.parse(text, true);
/**
 output {
  title: '',
  html: {
    title_page: '',
    script: `<div class="dialogue"><h4>INT. COFFEE SHOP - DAY</h4><p>A bustling coffee shop filled with the aroma of freshly brewed coffee and the chatter of patrons. SARAH, a 30-year-old writer with messy hair and ink-stained fingers, sits at a corner table, furiously typing on her laptop.</p></div><p>JOHN, a handsome barista in his mid-20s, approaches with a steaming mug.</p><div class="dialogue"><h4>JOHN</h4><p>Your usual, Sarah. Extra shot, no foam.<br />Sarah looks up, startled.</p></div><div class="dialogue"><h4>SARAH</h4><p>Oh, thanks John. You're a lifesaver.</p></div><div class="dialogue"><h4>JOHN</h4><p class="parenthetical">(smiling)</p><p>No problem. How's the new novel coming along?</p></div><div class="dialogue"><h4>SARAH</h4><p class="parenthetical">(sighing)</p><p>Slowly. Very slowly. I think my characters are plotting against me.</p></div><div class="dialogue"><h4>JOHN</h4><p class="parenthetical">(laughs)</p><p>Well, if they stage a revolt, I've got your back. And plenty of caffeine.</p></div><p>Sarah grins and takes a sip of her coffee.</p><div class="dialogue"><h4>SARAH</h4><p>You're officially my favorite person right now.<br />John winks and walks away. Sarah turns back to her laptop, a small smile playing on her lips as she begins to type again.</p></div><p>FADE OUT.<br />This screenplay snippet demonstrates some key elements of Fountain format:<br />Scene headings are in all caps and start with INT. or EXT.<br />Character names are in all caps before their dialogue.<br />Parentheticals for actions or tone are in parentheses on their own line.<br />Action lines are written in plain text.<br />Transitions like FADE OUT are in all caps.<br />Fountain allows screenwriters to focus on writing without worrying about formatting, as the plain text can be easily converted to properly formatted screenplays late</p>`
  },
  tokens: [
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'INT. COFFEE SHOP - DAY' },
  DialogueToken {
    type: 'dialogue',
    text: 'A bustling coffee shop filled with the aroma of freshly brewed coffee and the chatter of patrons. SARAH, a 30-year-old writer with messy hair and ink-stained fingers, sits at a corner table, furiously typing on her laptop.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken {
    type: 'action',
    text: 'JOHN, a handsome barista in his mid-20s, approaches with a steaming mug.'
  },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'JOHN' },
  DialogueToken {
    type: 'dialogue',
    text: 'Your usual, Sarah. Extra shot, no foam.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken { type: 'action', text: 'Sarah looks up, startled.' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'SARAH' },
  DialogueToken {
    type: 'dialogue',
    text: "Oh, thanks John. You're a lifesaver."
  },
  DialogueEndToken { type: 'dialogue_end' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'JOHN' },
  ParentheticalToken { type: 'parenthetical', text: '(smiling)' },
  DialogueToken {
    type: 'dialogue',
    text: "No problem. How's the new novel coming along?"
  },
  DialogueEndToken { type: 'dialogue_end' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'SARAH' },
  ParentheticalToken { type: 'parenthetical', text: '(sighing)' },
  DialogueToken {
    type: 'dialogue',
    text: 'Slowly. Very slowly. I think my characters are plotting against me.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'JOHN' },
  ParentheticalToken { type: 'parenthetical', text: '(laughs)' },
  DialogueToken {
    type: 'dialogue',
    text: "Well, if they stage a revolt, I've got your back. And plenty of caffeine."
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken {
    type: 'action',
    text: 'Sarah grins and takes a sip of her coffee.'
  },
  DialogueBeginToken { type: 'dialogue_begin', dual: undefined },
  CharacterToken { type: 'character', text: 'SARAH' },
  DialogueToken {
    type: 'dialogue',
    text: "You're officially my favorite person right now.\n" +
      'John winks and walks away. Sarah turns back to her laptop, a small smile playing on her lips as she begins to type again.'
  },
  DialogueEndToken { type: 'dialogue_end' },
  ActionToken {
    type: 'action',
    text: 'FADE OUT.\n' +
      'This screenplay snippet demonstrates some key elements of Fountain format:\n' +
      'Scene headings are in all caps and start with INT. or EXT.\n' +
      'Character names are in all caps before their dialogue.\n' +
      'Parentheticals for actions or tone are in parentheses on their own line.\n' +
      'Action lines are written in plain text.\n' +
      'Transitions like FADE OUT are in all caps.\n' +
      'Fountain allows screenwriters to focus on writing without worrying about formatting, as the plain text can be easily converted to properly formatted screenplays late'
  }
]
}
 */


function randomIntFromInterval(min, max) { // min and max included 
    return Math.floor(Math.random() * (max - min + 1) + min)
  }

const characterNames = Array.from(
    new Set(
        output.tokens
            .filter(token => token.type === 'character')
            .map(token => token.text)
    )
)

const characters = {}

const allVoices = voices.voices
characterNames.forEach(characterName => {
    const rand = randomIntFromInterval(0, allVoices.length - 1)
    const charVoice = allVoices[rand]
    characters[characterName] = charVoice
})


function is(input, text) {
    return input === text
}

function getDialog (output) {
    let isDialog = false
    const toProcess = []
    let character = null
    for (const token of output.tokens) {
        const tokenType = token.type

        if (is(tokenType, 'dialogue_begin')) {
            isDialog = true
        }
        if (is(tokenType, 'dialogue_end')) {
            isDialog = false
            character = null
        }

        if (isDialog && is(tokenType, 'character')) {
            character = token.text
        }
      
        if (isDialog && character && is(tokenType, 'dialogue')) {
            const characterName = character
            toProcess.push({
                characterName,
                character: characters[characterName],
                text: token.text
            })
        }
    }

    return toProcess
}

async function getAudio(toProcess, fileNameIn) {

    return new Promise(async (resolve, reject) => {
        try {
            const client = new ElevenLabsClient({ apiKey: ELEVENLABS_API_KEY });

            // const voiceId = 'pMsXgVXv3BLzUgSXRplE'
            const voiceId = toProcess.character.voice_id
            const audio = await client.textToSpeech.convert(voiceId, {
                optimize_streaming_latency: ElevenLabs.OptimizeStreamingLatency.Zero,
                output_format: ElevenLabs.OutputFormat.Mp32205032,
                text: toProcess.text,
                // text: "It sure does, Jackie\u2026 My mama always said: \u201CIn Carolina, the air's so thick you can wear it!\u201D",
                voice_settings: {
                    stability: 0.1,
                    similarity_boost: 0.3,
                    style: 0.2
                }
            });
            const fileName = `./readings/${fileNameIn}.mp3`;
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

async function playAudioSubs(palythroughId) {
    const path = `./readings/${palythroughId}`
    const files = fs.readdirSync(`./readings/${palythroughId}`)
    console.log('files', files)

    for (const fileName of files) {
        const file = fs.readFileSync(`${path}/${fileName}`)
        const stream = Readable.from(file)

        await play(stream)
    }

}

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

function concatAudio(palythroughId) {
    const path = Path.join(__dirname, '..', `/readings/${palythroughId}`)
    const files = fs.readdirSync(path).map(file => `${path}/${file}`)
    audioconcat(files)
        .concat(path + '-all.mp3')
        .on('start', function (command) {
            console.log('ffmpeg process started:', command)
        })
        .on('error', function (err, stdout, stderr) {
            console.error('Error:', err)
            console.error('ffmpeg stderr:', stderr)
        })
        .on('end', function (output) {
            console.error('Audio created in:', output)
        })
}


async function run() {
    console.log("Getting dialog")
    const toProcess = getDialog(output)
    // console.log('toProcess', toProcess)

    const audioArr = []
    console.log("Getting audio")
    let count = 0
    const palythroughId = uuid()

    if (!fs.existsSync(`./readings/${palythroughId}`)){
        fs.mkdirSync(`./readings/${palythroughId}`);
    }

    for (const processUnit of toProcess) {
        console.log("Getting audio for", processUnit.characterName)
        console.log("Getting audio text", processUnit.text)
        console.log("Getting audio voice_id", processUnit.character.voice_id)
        const audio = await getAudio(processUnit, `${palythroughId}/${count}`)

    

        console.log("Gottne")
        audioArr.push(audio)
        count++
    }
    
    await concatAudio(palythroughId)
    await playAudioSubs(palythroughId)

}

// run()

// playAudioSubs('8eac9c28-dc42-4842-b0cf-d3beed7f8494')

// concatAudio('8eac9c28-dc42-4842-b0cf-d3beed7f8494')

/**
 
curl --request GET \
--url https://api.elevenlabs.io/v1/voices/pMsXgVXv3BLzUgSXRplE \
--header "xi-api-key:sk_ab5e4f3b2331468d4baf6e7c77978a4192999d16a748935c"
*/