"use server";
import { runs } from "@trigger.dev/sdk/v3";

// const { runs } = tapi

import { authActionClient } from "@/actions/safe-action";
import { getScreenPlayAudioVersion } from "@v1/supabase/queries";
import { updateScreenplayVersion } from "@v1/supabase/mutations";
import { checkOnJobSchema } from "./schema-check-on-job";

export const cancelProcessAudio = authActionClient
  .schema(checkOnJobSchema)
  .metadata({
    name: "cance-process-audio",
  })
  .action(async ({ parsedInput: input}) => {
    try {

        const audioVersion = await getScreenPlayAudioVersion(input.audioVersionId)
        console.log("audioVersion", audioVersion)
        

        if (audioVersion?.job_id) {
            
            let page = await runs.list({
                status: ['WAITING_FOR_DEPLOY', 'QUEUED', 'EXECUTING', 'REATTEMPTING', 'FROZEN', 'FAILED' ],
                bulkAction: audioVersion?.job_id
            });

            if (page.data && page.data.length) {
                for (const job of page.data) {
                    const res = await runs.cancel(job.id);
                    console.log('job res', res)
                }
            }
        }

        await updateScreenplayVersion(input.audioVersionId, { status: 'unstarted'})
        return null
    } catch (e) {
        console.log('error getting signed url', e)
    }

  });