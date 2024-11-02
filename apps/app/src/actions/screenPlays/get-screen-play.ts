"use server";

import { authActionClient } from "@/actions/safe-action";
import { getScreenPlay as getScreenPlayIn, getScreenPlayLines as getScreenPlayLinesIn } from "@v1/supabase/queries";
import { screenPlaySchema } from "./schema-screen-play";

export const getScreenPlay = authActionClient
.schema(screenPlaySchema)
  .metadata({
    name: "get-screenplay",
  })
  .action(async ({ parsedInput: { screenPlayId, versionNumber } = {}, ctx: { user } }) => {
    if (!screenPlayId) return {}
    console.log('screenPlayId, versionNumber', screenPlayId, versionNumber)
    const result = await getScreenPlayIn(screenPlayId);
    const linesResult = await getScreenPlayLinesIn(screenPlayId, versionNumber);

    result.data.lines = linesResult.data
    return result;
  });
