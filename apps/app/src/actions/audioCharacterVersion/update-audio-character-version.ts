// updateAudioCharacterVersion
"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateAudioCharacterVersion } from "@v1/supabase/mutations";
import { updateAudioCharacterVersionSchema } from "./schema";

export const updateAudioCharacterVersionAction = authActionClient
  .schema(updateAudioCharacterVersionSchema)
  .metadata({
    name: "update-audio-character-version",
  })
  .action(async ({ parsedInput: {
    audioCharacterVersionId,
    voice_id,
    voice_data,
    voice_name,
  }}) => {
    const result = await updateAudioCharacterVersion(audioCharacterVersionId, {
        voice_id,
        voice_data,
        voice_name,
    });

    return result;
  });
