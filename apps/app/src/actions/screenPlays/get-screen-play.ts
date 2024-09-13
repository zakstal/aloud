"use server";

import { authActionClient } from "@/actions/safe-action";
import { getScreenPlay as getScreenPlayIn } from "@v1/supabase/queries";
import { screenPlaySchema } from "./schema-screen-play";

export const getScreenPlay = authActionClient
.schema(screenPlaySchema)
  .metadata({
    name: "get-screenplay",
  })
  .action(async ({ parsedInput: { screenPlayId } = {}, ctx: { user } }) => {
    if (!screenPlayId) return {}
    const result = await getScreenPlayIn(screenPlayId);

    return result;
  });
