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
  .action(async ({ parsedInput: { newLines, characters, screenplayId, versionNumber } = {}, ctx: { user } }) => {
    console.log('updateOrCreateLines----------------', newLines, characters, screenplayId, versionNumber)

    // Call the function to update or create lines in the DB
    const result = await updateOrCreateLinesInDb(newLines, characters, screenplayId, versionNumber);

    return result;
  });
