"use server";

import { authActionClient } from "@/actions/safe-action";
import { deleteScreenplay } from "@v1/supabase/mutations";
import { screenPlaySchema } from "./schema-screen-play";

export const deleteScreenPlayPermanatlyAction = authActionClient
  .schema(screenPlaySchema)
  .metadata({
    name: "delete-screenplay-permanatly",
  })
  .action(async ({ parsedInput: { screenPlayId } = {}, ctx: { user } }) => {
    if (!screenPlayId) return {}
    console.log('screenPlayId', screenPlayId)
    const result = await deleteScreenplay(screenPlayId);

    return result;
  });
