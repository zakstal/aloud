import { NextRequest, NextResponse } from 'next/server'; // To handle the request and response
import fs from 'fs'; // To save the file temporarily
import { getAudioVersionsByScreenplayId } from "@v1/supabase/queries";
import { updateAudioVersionUrl } from "@v1/supabase/mutations";
import textToVoiceProvders from "@v1/script-to-audio/voiceApis";


// temproary
import Path from 'path';
import url from 'url';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);


// temporary function 
async function getAudioQueue(data) {
  // data.sort((a, b) => {
  //   return a.lines.order = b.lines.order
  // })
  
  const dirPath = Path.join(__dirname,'../../../../../' , `./public/readings`)
  if (!fs.existsSync(dirPath)){
    fs.mkdirSync(dirPath);
  }

  for (const voiceVersion of data) {
    const audioCharacter = voiceVersion.audio_character_version
    const audioProviderName = audioCharacter.voice_data.audioProvider
    const textToSpeech = textToVoiceProvders[audioProviderName]
    const orderNumber = voiceVersion.lines.order
    const versionId = voiceVersion.audio_screenplay_version_id
    const text = voiceVersion.lines.text

    const fileName = `/${versionId}-${orderNumber}-${audioProviderName}-${audioCharacter.voice_name}.mp3`
    const path = Path.join(dirPath, fileName)
    try {

      const res = await textToSpeech(text, {
        voiceId: audioCharacter.voice_id,
        fileName: path
      })

      const playPath = `/readings` + fileName

      await updateAudioVersionUrl(voiceVersion.id, playPath, res.audioLengthInSeconds)

    } catch(e) {
      throw `Error sending data ${e}`
    }
  }

}

  
//TODO make sure route is behind auth
export async function GET(req: NextRequest, { params }, res: NextResponse) {

  const screenPlayVersionId = params["screen-play-version-id"]

  const audioVersions = await getAudioVersionsByScreenplayId(screenPlayVersionId)
  try {
    await getAudioQueue(audioVersions)
  } catch(e) {
    const resp = new NextResponse(JSON.stringify({ error: e }));
    return resp;
  }
 
  const resp = new NextResponse();
  return resp;
}
