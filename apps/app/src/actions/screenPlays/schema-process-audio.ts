import { z } from "zod";

export const processAudioSchema = z.object({
    screenPlayVersionId: z.string(),
});
  