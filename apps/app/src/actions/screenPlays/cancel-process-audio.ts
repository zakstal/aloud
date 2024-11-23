"use server";
import { runs } from "@trigger.dev/sdk/v3";

// const { runs } = tapi

import { authActionClient } from "@/actions/safe-action";
import { getScreenPlayAudioVersion } from "@v1/supabase/queries";
import { updateScreenplayVersion } from "@v1/supabase/mutations";
import { createCancelProcessAudio } from "./schema-cancel-process-audio";

export const cancelProcessAudio = authActionClient
  .schema(createCancelProcessAudio)
  .metadata({
    name: "cance-process-audio",
  })
  .action(async ({ parsedInput: input}) => {
    try {

        const audioVersion = await getScreenPlayAudioVersion(input.audioVersionId)
        const okCancelStatuses = ['WAITING_FOR_DEPLOY', 'QUEUED', 'EXECUTING', 'REATTEMPTING', 'FROZEN' ]
        
        if (audioVersion?.job_id) {
            const res = await runs.retrieve(audioVersion?.job_id);

            runs.cancel(audioVersion?.job_id)

            if (res?.relatedRuns?.children) {
                for (const job of res?.relatedRuns?.children) {
                    if (!okCancelStatuses.includes(job.status)) continue
                    const res = await runs.cancel(job.id);
                }
            }
        }

        const status = audioVersion?.total_lines_completed > 0 ? 'partial' : 'unstarted'

        await updateScreenplayVersion(input.audioVersionId, { status })
        return null
    } catch (e) {
        console.log('error getting signed url', e)
    }

  });