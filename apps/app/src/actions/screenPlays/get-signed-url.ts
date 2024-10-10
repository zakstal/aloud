"use server";

import { authActionClient } from "@/actions/safe-action";
import { getSignedUrl as getSignedUrlIn } from "@v1/supabase/queries";
import { getSingedUrlSchema } from "./schema-get-signed-url";

export const getSignedUrl = authActionClient
  .schema(getSingedUrlSchema)
  .metadata({
    name: "get-signed-url",
  })
  .action(async ({ parsedInput: input, ctx: { user } }) => {
    console.log("input.url", input.url)
    try {

        const result = await getSignedUrlIn(input.url);
        return result;
    } catch (e) {
        console.log('error getting signed url', e)
    }

  });
