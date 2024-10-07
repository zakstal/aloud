"use client";


export const processAudio = async function({ screenPlayVersionId }: { screenPlayVersionId: number}) {
    if (!screenPlayVersionId) return {}
    // TODO upate to use a process.env base url 
    const result = await fetch(`http://localhost:3000/api/text-to-audio/${screenPlayVersionId}/${userId}`)

    return result;
};