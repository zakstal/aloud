import { z } from "zod";

export const createCancelProcessAudio = z.object({
    audioVersionId: z.string(),
});