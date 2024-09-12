import { textToSpeech } from '../src/voiceApis/murph/murph.js'
import fs from 'fs'
import { v4 as uuid } from "uuid";
import { download, playAudioSubs, concatAudio } from '../src/audioUtils.js';
import { getTextFromPdf } from '../src/pdfToText.js'
import { parse } from '../src/scriptParsers/fountainParser.js'
import Path from 'path';

import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

var pdf_path = "barbershop-wars-1.pdf";
const pathPDf = Path.join(__dirname, pdf_path)
console.log("pathPDf", pathPDf)
const text = await getTextFromPdf(pathPDf)

const output = parse(text)

// console.log("text", text)
console.log("output", output.dialog)
// console.log("output", output.output)


const characterMap = {
    Narrator: 'en-US-charlotte',
    SOYBOY: 'en-AU-jimm',
    SKULLKID: 'en-US-ronnie'
}
const characterMapSTYLE = {
    Narrator: 'Narration',
    SOYBOY: 'Conversational',
    SKULLKID: 'Angry'
}

async function run() {
    console.log("Getting dialog")
    const text = await getTextFromPdf(pathPDf)

    const output = parse(text)
    const toProcess = output.dialog
    // console.log('toProcess', toProcess)

    console.log("Getting audio")
    let count = 0
    const palythroughId = 'murph-' + uuid()

    if (!fs.existsSync(`./readings/${palythroughId}`)){
        fs.mkdirSync(`./readings/${palythroughId}`);
    }

    for (const processUnit of toProcess) {
        // console.log("Getting audio for", processUnit.characterName)
        // console.log("Getting audio text", processUnit.text)
        const voiceId = characterMap[processUnit.characterName]
        console.log('processUnit', processUnit)
        console.log('voiceId-----', voiceId)
        console.log('count-----', count)
        const style = characterMapSTYLE[processUnit.characterName]

        if (!voiceId) continue
        console.log('is voice')
        const res = await textToSpeech(processUnit.text, {
            voiceId,
            style,
        })

    
        await download(res.audioFile, `./readings/${palythroughId}/${count}-${processUnit.characterName}.mp3`)
        console.log("Gottne")

        count++
    }
    
    await concatAudio(palythroughId)
    await playAudioSubs(palythroughId)

}

run()

