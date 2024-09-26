"use server";

import { authActionClient } from "@/actions/safe-action";
import { createScreenPlay } from "@v1/supabase/mutations";

export const startScreenPlay = authActionClient
  .metadata({
    name: "create-screenplay",
  })
  .action(async ({ parsedInput, ctx: { user } }) => {
    const result = await createScreenPlay(
        user.id,
      {
        // title: parsed?.output && parsed.output.html.script, 
        title: '', 
        dialog: [],
        type: 'movie', 
        characters: [], 
        total_lines: 0, 
        screen_play_text:  '',
        screen_play_fountain: []
        // screen_play_text: parsedText
      }
    )

    return result;
  });