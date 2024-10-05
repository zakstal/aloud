import { NextRequest, NextResponse } from 'next/server'; // To handle the request and response
import fs from 'fs'; // To save the file temporarily
import { getAudioVersionsByScreenplayId, getUser } from "@v1/supabase/queries";
import { updateAudioVersionUrl } from "@v1/supabase/mutations";
// import textToVoiceProvders from "@v1/script-to-audio/voiceApis";
import { tasks } from "@trigger.dev/sdk/v3";

// @ts-ignore
import type { getAudioTask } from "@v1/jobs/triggersExample";
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
async function getAudioQueue(data) {
  const session  = await getUser()
  const userId = session.data.user.id
  try {

    const handle = await tasks.batchTrigger<typeof getAudioTask>("get-audio-2", data.slice(0, 4).map((u) => {
      u.userId = userId
      return { payload: u }
    }));
    console.log("handle------", handle)
  } catch(e) {
    console.log('handle task error--------', e)
  }
}

  
//TODO make sure route is behind auth
export async function GET(req: NextRequest, { params }, res: NextResponse) {

  console.log("audio-req------------------", req)
  const screenPlayVersionId = params["screen-play-version-id"]

  const audioVersions = await getAudioVersionsByScreenplayId(screenPlayVersionId)
  try {
    console.log("audio-versions------------------", audioVersions)
    await getAudioQueue(audioVersions)
  } catch(e) {
    const resp = new NextResponse(JSON.stringify({ error: e }));
    return resp;
  }
 
  const resp = new NextResponse();
  return resp;
}
