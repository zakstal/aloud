"use server";

import { authActionClient } from "@/actions/safe-action";
import { getScreenPlays } from "@v1/supabase/queries";

export const shareLinkAction = authActionClient
  .metadata({
    name: "get-screenplays",
  })
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    const result = await getScreenPlays(user.id);

    return result;
  });
