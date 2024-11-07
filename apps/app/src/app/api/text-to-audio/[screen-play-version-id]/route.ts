import { NextRequest, NextResponse } from 'next/server'; // To handle the request and response
import fs from 'fs'; // To save the file temporarily
import { getAudioVersionsByScreenplayId, getUser, getScreenPlayAudioVersion } from "@v1/supabase/queries";
import { setAudioVersionCount, setAudioVersionInProgress, updateJobId, updateScreenplayVersion } from "@v1/supabase/mutations";
// import textToVoiceProvders from "@v1/script-to-audio/voiceApis";
import { tasks } from "@trigger.dev/sdk/v3";

// @ts-ignore
import type { getAudioTask } from "@v1/jobs/getAudioTask";
import type { trackAudioRuns } from "@v1/jobs/trackAudioRuns";
//     👆 **type-only** import

// export async function POST(request: Request) {
//   const body = await request.json();

//   // Trigger the task, this will return before the task is completed
  

//   return NextResponse.json(handle);
// }


// temproary
import Path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);


// temporary function 
async function getAudioQueue(data, screenPlayVersionId) {
  const session  = await getUser()
  const userId = session.data.user.id
  try {

    const handle = await tasks.batchTrigger<typeof getAudioTask>("get-audio-4", data.map((u) => {
    // const handle = await tasks.batchTrigger<typeof getAudioTask>("get-audio-2", data.slice(0, 1).map((u) => {
      u.userId = userId
      return { payload: u }
    }));

    // const trackHandle = await tasks.trigger<typeof trackAudioRuns>("track-audio-runs-1", {
    //   batch: handle,
    //   screenPlayVersionId,
    // })

    await updateJobId(screenPlayVersionId, handle?.batchId)
    console.log("handle------", handle)
  } catch(e) {
    console.log('handle task error--------', e)
  }
}

  
//TODO make sure route is behind auth
export async function GET(req: NextRequest, { params }, res: NextResponse) {

  console.log("audio-req------------------")
  const screenPlayVersionId = params["screen-play-version-id"]
  console.log("audio-req------------------", screenPlayVersionId)
  const audioVersion = await getScreenPlayAudioVersion(screenPlayVersionId)
  const status = audioVersion.status
  if (!['unstarted', 'partial', 'failed'].includes(audioVersion.status)) return new NextResponse(JSON.stringify({ status }));

  await setAudioVersionInProgress(screenPlayVersionId)

  const session  = await getUser()
  const userId = session.data.user.id

    const trackHandle = await tasks.trigger<typeof trackAudioRuns>("track-audio-runs-8", {
      screenPlayVersionId,
      userId,
    })

  // const audioVersions = await getAudioVersionsByScreenplayId(screenPlayVersionId)

  // console.log("audio-versions------------------", audioVersions)

  // if (!audioVersions.length) {
  //   await updateScreenplayVersion(screenPlayVersionId, { status: 'full' })
  //   return new NextResponse(JSON.stringify({  status: 'full' }));
  // }

  // if (!audioVersion.total_lines) {
  //   await setAudioVersionCount(screenPlayVersionId, audioVersions.length)
  // }


  // try {
    
  //   await getAudioQueue(audioVersions, screenPlayVersionId)
  // } catch(e) {
  //   const resp = new NextResponse(JSON.stringify({ error: e, status }));
  //   return resp;
  // }
 
  const resp = new NextResponse(JSON.stringify({ status }));
  return resp;
}
