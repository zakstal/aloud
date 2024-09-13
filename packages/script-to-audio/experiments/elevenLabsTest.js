import { textToSpeech } from '../src/voiceApis/elevenLabs/elevenLabs.js';
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

const text = await getTextFromPdf(pathPDf)

const output = parse(text)

// console.log("text", text)
// console.log("output", output.dialog)
// console.log("output", output.output.tokens)


const characterMap = {
    Narrator: 'IKne3meq5aSn9XLyUdCD',
    SOYBOY: 'iP95p4xoKVk53GoZ742B',
    SKULLKID: 'N2lVS1w4EtoT3dr4eOWO'
}

async function run() {
    console.log("Getting dialog")
    const text = await getTextFromPdf(pathPDf)

    const output = parse(text)
    const toProcess = output.dialog
    // console.log('toProcess', toProcess)

    console.log("Getting audio")
    let count = 0
    const palythroughId = 'eleven-' + uuid()

    console.log("palythroughId", palythroughId)
    if (!fs.existsSync(`./readings/${palythroughId}`)){
        fs.mkdirSync(`./readings/${palythroughId}`);
    }

    for (const processUnit of toProcess) {
        console.log("Getting audio for", processUnit.characterName)
        console.log("Getting audio text", processUnit.text)
        const voiceId = characterMap[processUnit.characterName]
        if (!voiceId) continue
        const res = await textToSpeech(processUnit.text, {
            voiceId,
        })

        await textToSpeech(processUnit.text, {
            voiceId,
            fileName: `${palythroughId}/${count}-${processUnit.characterName}`
        })
        count++
    }
    
    
    await concatAudio(palythroughId)
    await playAudioSubs(palythroughId)

}

run()

