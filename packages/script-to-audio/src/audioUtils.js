import https from 'https'
import fs from 'fs'
import { play } from "elevenlabs";
import { v4 as uuid } from "uuid";
import { Readable } from 'stream';
import audioconcat from'audioconcat'

import url from 'url';
import Path from 'path'
const __filename = url.fileURLToPath(import.meta.url);
export const __dirname = Path.dirname(__filename);

export function download(url, destPath) {
    return new Promise((resolve, reject) => {

        https
        .get(url, res => {
            // Open file in local filesystem
            const file = fs.createWriteStream(destPath)
            
            // Write data into local file
            res.pipe(file)
            
            // Close the file
            file.on('finish', () => {
                file.close()
                console.log(`File downloaded!`)
                resolve(destPath)
            })
        })
        .on('error', err => {
            console.log('Error: ', err.message)
            reject(err)
        })
    })
}

export const playFile = async (filePath) => {
    const file = fs.readFileSync(filePath)
    const stream = Readable.from(file)

    return await play(stream)
}

export async function playAudioSubs(palythroughId) {
    const path = `./readings/${palythroughId}`
    const files = fs.readdirSync(`./readings/${palythroughId}`)
    console.log('files', files)

    for (const fileName of files) {
        await playFile(`${path}/${fileName}`)
    }

}


export function concatAudio(palythroughId) {
    const path = Path.join(__dirname, '..', `/readings/${palythroughId}`)
    const files = fs.readdirSync(path).map(file => `${path}/${file}`)
    const filesSorted = files.sort((a, b) => {
        const splitA = a.split('/')
        const lastA = Number(splitA[splitA.length - 1].split('-')[0])
        
        const splitB = b.split('/')
        const lastB = Number(splitB[splitB.length - 1].split('-')[0])
        return lastA - lastB
    })
    console.log("filesSorted", filesSorted)
    audioconcat(filesSorted)
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
