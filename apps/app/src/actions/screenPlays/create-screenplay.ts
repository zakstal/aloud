"use server";

import { authActionClient } from "@/actions/safe-action";
import { createScreenPlay } from "@v1/supabase/mutations";
import { createScreenPlaySchema } from "./schema-create-screenplay";
import { parse } from "@v1/script-to-audio/parsers";


export const startScreenPlay = authActionClient
  .schema(createScreenPlaySchema)
  .metadata({
    name: "create-screenplay",
  })
  .action(async ({ parsedInput: { screenPlayText = '' } = {}, ctx: { user } }) => {
    console.log('create')
    const text = decodeURIComponent(escape(atob(screenPlayText)))
    console.log('after decode')
    const parsed = await parse(text)
    console.log('after parse')
    try {
        const result = await createScreenPlay(
            user.id,
            {
                title: parsed?.dialog && parsed.dialog[0]?.text?.toLowerCase() || '', 
                dialog: parsed?.dialog,
                type: 'movie', 
                characters: (parsed?.characterGenders?.length ? parsed?.characterGenders : parsed?.characterGenders) || [], 
                total_lines: 0, 
                screen_play_text:  parsed?.output && parsed.output?.html?.script || '',
                screen_play_fountain:  parsed?.output && parsed.output.tokens
            }
        )

        console.log("result-----------", result)
    return result;
    } catch(e) {
        console.log("error in start screenplay", e)
        return {error: e}
    }

  });