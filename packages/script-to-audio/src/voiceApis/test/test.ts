
const audioFiles = [
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-47-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-42-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-46-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-37-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-30-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-23-elevenLabs-Callum.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-25-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-18-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-16-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-15-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-14-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-12-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-13-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-9-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-10-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-7-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-35-elevenLabs-Charlotte.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-39-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-48-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-0-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-28-elevenLabs-Callum.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-20-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-5-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-32-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-38-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-44-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-11-elevenLabs-Charlie.mp3',
    '091b4dc3-c34c-4ad3-87da-682bcf40d867/b3ec9792-b6a1-420f-ba85-73f87107c0e3-17-elevenLabs-Charlie.mp3',
]


export const createTextToSpeech = () => {
    let idx = 0
    return () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(audioFiles[idx])
                idx = (idx + 1) % audioFiles.length
            }, 5000)
        })
    }
}

export const textToSpeech = createTextToSpeech();