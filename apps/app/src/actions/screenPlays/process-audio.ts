"use client";

import { authActionClient } from "@/actions/safe-action";
import { processAudioSchema } from "./schema-process-audio";

export const processAudio = async function({ screenPlayVersionId }) {
    if (!screenPlayVersionId) return {}
    // TODO upate to use a process.env base url 
    const result = await fetch(`http://localhost:3000/api/text-to-audio/${screenPlayVersionId}`)

    return result;
};