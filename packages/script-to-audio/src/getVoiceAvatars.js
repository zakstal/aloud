import voices from './voices.js'
import fs from 'fs'

const filePath = './src/voiceAvatars.json'
let avatars = {}
if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(avatars))
} else {
    avatars = JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8', flag: 'r' }))
}   

const  getImage = (number, gender) => `https://xsgames.co/randomusers/assets/avatars/${gender}/${number}.jpg`
let maleCount = 1
let femaleCount = 1
for (const voice of voices.all) {
    if (avatars[voice.voiceId]) continue

    let url = null
    if (voice.gender === 'male') {
        url = getImage(maleCount, 'male')
        maleCount++
    } else if (voice.gender === 'female') {
        url = getImage(femaleCount, 'female')
        femaleCount++
    } else {
        if (Math.random() > 0.5) {
            url = getImage(femaleCount, 'female')
            femaleCount++
        } else {
            url = getImage(maleCount, 'male')
            maleCount++
        }
    }

    avatars[voice.voiceId] = url
    // console.log("url", url)
}

fs.writeFileSync(filePath, JSON.stringify(avatars))