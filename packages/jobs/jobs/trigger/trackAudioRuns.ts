import { logger, task, tasks, runs } from "@trigger.dev/sdk/v3";
import { createClient } from '@v1/supabase/serviceClient'
import type { getAudioTask } from "./getAudio";

// export async function incrementTotalLinesCompleted(audioVersionId: string, numberCompleted: number) {
//   if (!numberCompleted) return
//   const supabase = createClient();
//   console.log('Incrementing total_lines_completed for audioVersionId:', audioVersionId);

//   try {
//     // Fetch the current values of total_lines and total_lines_completed
//     const { data: currentData, error: fetchError } = await supabase
//       .from("audio_screenplay_versions")
//       .select("total_lines, total_lines_completed")
//       .eq("id", audioVersionId)
//       .single();

//     if (fetchError) {
//       console.error("Error fetching current line counts:", fetchError);
//       throw fetchError;
//     }

//     const { total_lines } = currentData;

//     // Increment total_lines_completed by 1
//     const newTotalLinesCompleted = numberCompleted;

//     // Prepare the update payload
//     let updatePayload = {
//       total_lines_completed: newTotalLinesCompleted,
//     };

//     // If the new total lines completed equals total lines, set status to 'full'
//     if (newTotalLinesCompleted >= total_lines) {
//       updatePayload.status = 'full';
//     }

//     // Update the record with the new total_lines_completed (and status if needed)
//     const { data, error: updateError } = await supabase
//       .from("audio_screenplay_versions")
//       .update({updatePayload})
//       .eq("id", audioVersionId);

//     if (updateError) {
//       console.error("Error updating total_lines_completed:", updateError);
//       throw updateError;
//     }

//     return data;  // Return the updated record
//   } catch (error) {
//     console.error("Error incrementing total_lines_completed:", error);
//     throw error;
//   }
// }

/**
 * This job is for triggering and tradcking the progress of the getAudio jobs
 * NB: these supabase functions are here because the credentials are different when running in a different environment.
 */

const getId = () => (Math.random() + 1).toString(36).substring(7);

export async function getScreenPlayAudioVersion(audioVersionId: string) {
  const supabase = createClient();
  console.log('Checking if audioVersionId is in progress:', audioVersionId);
  
  try {
    const { data, error } = await supabase
      .from("audio_screenplay_versions")
      .select("status, job_id, id, total_lines, screenplay_id")
      .eq("id", audioVersionId)
      .single(); // Ensure only one row is returned

    if (error) {
      console.log("error checking status", error);
      throw error;
    }

    return data;  // The status is not 'inProgress'
  } catch (error) {
    console.error("Error checking audio version status:", error);
    throw error;
  }
}

export async function getAudioVersionsByScreenplayId(screenplayId: string, minOrderNumber: number = 0) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("audio_version")
      .select(`
        id,
        screenplay_id,
        audio_file_url,
        line_id,
        version_number,
        created_at,
        audio_screenplay_version_id,
        audio_character_version_id,
        lines (
          id,
          text,
          order,
          deleted,
          characters (
            audio_character_version!fk_audio_character_version (
              id,
              version_number,
              voice_data,
              voice_id,
              voice_name
            )
          )
        )
      `)
      .eq("screenplay_id", screenplayId) // Filter by screenplay_id
      .eq('lines.deleted', false) 
      .not("lines.text", "is", null)
      .is("audio_file_url", null)
      .order("lines(order)", { ascending: false });

    if (error) {
      throw error;
    }

    return data.filter(audioVersion => Boolean(audioVersion?.lines?.text));  // Return the fetched audio versions
  } catch (error) {
    console.error("Error fetching audio versions:", error);
    throw error;
  }
}

export async function setAudioVersionInProgress(audioVersionId: string) {
  const supabase = createClient();
  console.log('audioVersionId', audioVersionId)
  
  try {
    const { data, error } = await supabase
      .from("audio_screenplay_versions")
      .update({
        status: 'inProgress'
      })
      .eq("id", audioVersionId);

    if (error) {
      console.log("error setting status to inProgress", error)
      throw error;
    }

    return data;  // Return the updated audio version
  } catch (error) {
    console.error("Error setting status to inProgress:", error);
    throw error;
  }
}

export async function setAudioVersionCount(audioVersionId: string, count = 0) {
  const supabase = createClient();
  console.log('audioVersionId', audioVersionId)
  
  try {
    const { data, error } = await supabase
      .from("audio_screenplay_versions")
      .update({
        total_lines: count
      })
      .eq("id", audioVersionId);

    if (error) {
      console.log("error setting status to inProgress", error)
      throw error;
    }

    return data;  // Return the updated audio version
  } catch (error) {
    console.error("Error setting status to inProgress:", error);
    throw error;
  }
}

export async function updateJobId(audioScreenplayVersionId: string, jobId: string) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('audio_screenplay_versions')
      .update({ job_id: jobId })
      .eq('id', audioScreenplayVersionId);

    if (error) {
      console.error('Error updating job_id:', error);
      throw error;
    }

    return data;  // Return the updated record(s)
  } catch (error) {
    console.error('Error updating job_id:', error);
    throw error;
  }
}

interface updateScreenplayVersionInput {
  status?: string;
  job_id?: string;

}
export async function updateScreenplayVersion(audioScreenplayVersionId: string, updateObj: updateScreenplayVersionInput) {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('audio_screenplay_versions')
      .update(updateObj)
      .eq('id', audioScreenplayVersionId);

    if (error) {
      console.error('Error updating job_id:', error);
      throw error;
    }

    return data;  // Return the updated record(s)
  } catch (error) {
    console.error('Error updating job_id:', error);
    throw error;
  }
}


export async function incrementTotalLinesCompleted(audioVersionId: string) {
    const supabase = createClient();
    logger.info('Incrementing total_lines_completed for audioVersionId:', audioVersionId);
  
    try {
      const { data: currentCount, error: fetchErrorVersions } = await supabase
        .from("audio_version")
        .select("id")  
        .not("audio_file_url", "is", null)
        .eq("audio_screenplay_version_id", audioVersionId)
  
        logger.info('currentCount----------', currentCount.length)
  
      if (fetchErrorVersions) {
        logger.error("Error fetching current line counts:", fetchErrorVersions);
        throw fetchErrorVersions;
      }
  
      // Fetch the current values of total_lines and total_lines_completed
      const { data: currentData, error: fetchError } = await supabase
        .from("audio_screenplay_versions")
        .select("total_lines, total_lines_completed")
        .eq("id", audioVersionId)
        .single();
  
      if (fetchError) {
        console.error("Error fetching current line counts:", fetchError);
        throw fetchError;
      }
  
      const { total_lines } = currentData;
  
      // Increment total_lines_completed by 1
      const newTotalLinesCompleted = currentCount?.length || 0;
  
      // Prepare the update payload
      let updatePayload = {
        total_lines_completed: newTotalLinesCompleted,
      };
  
      // If the new total lines completed equals total lines, set status to 'full'
      if (newTotalLinesCompleted >= total_lines) {
        updatePayload.status = 'full';
      }
  
      logger.info('updatePayload', JSON.stringify(updatePayload))
      // Update the record with the new total_lines_completed (and status if needed)
      const { data, error: updateError } = await supabase
        .from("audio_screenplay_versions")
        .update(updatePayload)
        .eq("id", audioVersionId);
  
      if (updateError) {
        logger.error("Error updating total_lines_completed:", updateError);
        throw updateError;
      }
  
      return data;  // Return the updated record
    } catch (error) {
      logger.error("Error incrementing total_lines_completed:", error);
      throw error;
    }
  }

  async function fetchRuns(config) {
    logger.info('fetchRuns in')
    const runsData = []
    let page = await runs.list(config);
  
    logger.info('page in', { page })
    // Process the first page
    for (const run of page.data) {
        runsData.push(run);
    }
  
    // Fetch and process subsequent pages
    logger.info('before while in')
    while (page.hasNextPage()) {
      logger.info('while in', { page })
      page = await page.getNextPage();
      for (const run of page.data) {
        runsData.push(run);
      }
    }

    logger.info('before end in')
    return runsData
  }

const processBatch = (payload, tag, audioVersions, screenPlayVersionId) => {

  const batch = await tasks.batchTrigger<typeof getAudioTask>('get-audio-4', audioVersions.map((u) => {
    // const handle = await tasks.batchTrigger<typeof getAudioTask>("get-audio-2", data.slice(0, 1).map((u) => {
      u.userId = payload.userId
      const options = { tags: tag }
      return { payload: u, options }
    }));

    console.log("handle------", batch)
    console.log("tag------", tag)

    await updateJobId(screenPlayVersionId, batch?.batchId)
  } catch(e) {
    logger.error('Error--', e)
    return e;
  }


  try {

    const numberOfRuns = batch.runs.length
    const runsSet = new Set(batch.runs)
    let isProcessing = false
    await new Promise((resolve) => {  
      const inter = setInterval(async () => {
        logger.info('Interval')
        if (isProcessing) return
        isProcessing = true
        
        // const completed = .filter();
       
        logger.info('fetchRuns first')
        let all = await fetchRuns({
          status: ['FAILED', 'COMPLETED' ],
          bulkAction: batch?.batchId,
          tag,
        });
        logger.info('fetchRuns end')

        const completed = all.filter(item => item.status === 'COMPLETED')
        const failed = all.filter(item => item.status === 'FAILED')
        logger.info('completed', completed)
        logger.info('failed', failed)
        
        const numberCompleted = completed?.length || 0
        const numberFailed = failed?.length || 0
        logger.info('runs', {numberOfRuns, numberFailed, numberCompleted, screenPlayVersionId: payload.screenPlayVersionId,})
        
        await incrementTotalLinesCompleted(payload.screenPlayVersionId, numberCompleted)

        if (numberCompleted != null && numberCompleted === numberOfRuns) {
          // TODO we may need to handle errors
          await updateScreenplayVersion(payload.screenPlayVersionId, {
            status: 'full'
          })
          clearTimeout(inter)
          resolve()
        }
      
        if (numberFailed === numberOfRuns) {
          // TODO we may need to handle errors
          clearTimeout(inter)
          await updateScreenplayVersion(payload.screenPlayVersionId, {
            status: 'failed'
          })
          
          resolve()
        }
     
        if (numberFailed !== 0 && numberCompleted !== 0 && numberFailed + numberCompleted === numberOfRuns) {
          // TODO we may need to handle errors
          clearTimeout(inter)
          await updateScreenplayVersion(payload.screenPlayVersionId, {
            status: 'partial'
          })

          resolve()
        }
        
        
        
        isProcessing = false
      }, 2000)
    })
    
  } catch(e) {
    logger.error('error tracking jobs', e)
  }

}

/**
 {
   batchId: 'batch_rkyr2it9uknwztb6goqq9',
   runs: [
     { id: 'run_yktv5oerm2t354tvwpse7' },
     { id: 'run_j8vr54wmvitby8sygnhmn' },
     { id: 'run_x3qsipwbym8dr1bmgmmjw' },
    ...
   ]
 }
 */
const aloudMeta = {
  batchId: null
}
export const trackAudioRuns = task({
  id: "track-audio-runs-12",
  cleanup: async (payload, { ctx }) => {
    logger.info("cleanup payLoad", aloudMeta)
    logger.info("cleanup ctx", ctx)
  },
  onFailure: async (payload, error, { ctx }) => {
    logger.info("Task failed", ctx.task.id, error);
  },
  run: async (payload: unknown, { ctx }) => {
    let batch = null
    let tag = null
    try {
      const screenPlayVersionId = payload.screenPlayVersionId
      
      // TODO batch to 50 or 100 at a time
      const audioVersion = await getScreenPlayAudioVersion(screenPlayVersionId)

      logger.info('audioVersion---', { audioVersion })
      await setAudioVersionInProgress(screenPlayVersionId)
    
      const audioVersionsUnsorted = await getAudioVersionsByScreenplayId(audioVersion.screenplay_id)
      const audioVersions = audioVersionsUnsorted.reverse()
    
      if (!audioVersions.length) {
        await updateScreenplayVersion(screenPlayVersionId, { status: 'full' })
        return
      }
    
      if (!audioVersion.total_lines) {
        await setAudioVersionCount(screenPlayVersionId, audioVersions.length)
      }
    
    
      logger.log('audioVersions', audioVersions)
      tag = "get-audio-4-" + getId()
      
      batch = await tasks.batchTrigger<typeof getAudioTask>('get-audio-4', audioVersions.map((u) => {
      // const handle = await tasks.batchTrigger<typeof getAudioTask>("get-audio-2", data.slice(0, 1).map((u) => {
        u.userId = payload.userId
        const options = { tags: tag }
        return { payload: u, options }
      }));

      console.log("handle------", batch)
      console.log("tag------", tag)

      await updateJobId(screenPlayVersionId, batch?.batchId)
    } catch(e) {
      logger.error('Error--', e)
      return e;
    }


    try {

      const numberOfRuns = batch.runs.length
      const runsSet = new Set(batch.runs)
      let isProcessing = false
      await new Promise((resolve) => {  
        const inter = setInterval(async () => {
          logger.info('Interval')
          if (isProcessing) return
          isProcessing = true
          
          // const completed = .filter();
         
          logger.info('fetchRuns first')
          let all = await fetchRuns({
            status: ['FAILED', 'COMPLETED' ],
            bulkAction: batch?.batchId,
            tag,
          });
          logger.info('fetchRuns end')

          const completed = all.filter(item => item.status === 'COMPLETED')
          const failed = all.filter(item => item.status === 'FAILED')
          logger.info('completed', completed)
          logger.info('failed', failed)
          
          const numberCompleted = completed?.length || 0
          const numberFailed = failed?.length || 0
          logger.info('runs', {numberOfRuns, numberFailed, numberCompleted, screenPlayVersionId: payload.screenPlayVersionId,})
          
          await incrementTotalLinesCompleted(payload.screenPlayVersionId, numberCompleted)

          if (numberCompleted != null && numberCompleted === numberOfRuns) {
            // TODO we may need to handle errors
            await updateScreenplayVersion(payload.screenPlayVersionId, {
              status: 'full'
            })
            clearTimeout(inter)
            resolve()
          }
        
          if (numberFailed === numberOfRuns) {
            // TODO we may need to handle errors
            clearTimeout(inter)
            await updateScreenplayVersion(payload.screenPlayVersionId, {
              status: 'failed'
            })
            
            resolve()
          }
       
          if (numberFailed !== 0 && numberCompleted !== 0 && numberFailed + numberCompleted === numberOfRuns) {
            // TODO we may need to handle errors
            clearTimeout(inter)
            await updateScreenplayVersion(payload.screenPlayVersionId, {
              status: 'partial'
            })

            resolve()
          }
          
          
          
          isProcessing = false
        }, 2000)
      })
      
    } catch(e) {
      logger.error('error tracking jobs', e)
    }

    return {
      message: 'success',
      error: null
    }
  }

});
