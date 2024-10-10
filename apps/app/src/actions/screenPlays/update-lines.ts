"use server";

import { authActionClient } from "@/actions/safe-action";
import { updateOrCreateLinesInDb } from "@v1/supabase/mutations"; // Assuming you have this function to handle DB updates
import { updateOrCreateLinesSchema } from "./schema-update-lines";

// Updated action to handle creating or updating lines
export const updateOrCreateLines = authActionClient
  .schema(updateOrCreateLinesSchema)
  .metadata({
    name: "update-or-create-lines",
  })
  .action(async ({ parsedInput: { created, removed, updated, characters, screenplayId } = {}, ctx: { user } }) => {
    console.log('updateOrCreateLines----------------', characters, screenplayId)

    // Call the function to update or create lines in the DB
    const result = await updateOrCreateLinesInDb(created, removed, updated, characters, screenplayId);

    return result;
  });
