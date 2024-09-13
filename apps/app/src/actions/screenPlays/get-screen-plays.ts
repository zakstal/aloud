"use server";

import { authActionClient } from "@/actions/safe-action";
import { getScreenPlays as getScreenPlaysIn } from "@v1/supabase/queries";

export const getScreenPlays = authActionClient
  .metadata({
    name: "get-screenplays",
  })
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const result = await getScreenPlaysIn(user.id);

    return result;
  });
