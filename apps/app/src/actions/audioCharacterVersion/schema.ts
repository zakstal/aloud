import { z } from "zod";

export const updateAudioCharacterVersionSchema = z.object({
  audioCharacterVersionId: z.string(),
  voice_id: z.string().optional(),
  voice_data: z.any().optional(),
  voice_name: z.string().optional(),
});
