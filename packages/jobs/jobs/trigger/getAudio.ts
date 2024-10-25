import { logger, task, wait } from "@trigger.dev/sdk/v3";
import { getAudioVersion } from '@v1/supabase/queries'
import { updateAudioVersionUrl, incrementTotalLinesCompleted } from "@v1/supabase/mutations";
import { createClient } from '@v1/supabase/serviceClient'
import textToVoiceProvders from "@v1/script-to-audio/voiceApis";
import fs from 'fs'
import path from 'path'

const supabase = createClient();

const BUCKET = 'audio_version_lines'

export const getAudioTask = task({
  id: "get-audio-4",
  run: async (payload: unknown, { ctx }) => {
    logger.log("payload", { payload })
    const voiceVersion = payload
    const audioCharacter = voiceVersion.audio_character_version
    // const audioProviderName = audioCharacter.voice_data.audioProvider
    const audioProviderName = 'test'
    // const textToSpeech = textToVoiceProvders['test']
    const textToSpeech = textToVoiceProvders[audioProviderName]
    const orderNumber = voiceVersion.lines.order
    const versionId = voiceVersion.audio_screenplay_version_id
    const text = voiceVersion.lines.text

    const userIdFolder = payload.userId
    const fileName = `${versionId}-${orderNumber}-${audioProviderName}-${audioCharacter.voice_name}.mp3`
    const userIdFileName = `${userIdFolder}/${fileName}`
    const outputPath = path.join("/tmp", fileName);

    logger.log("fileName",{ fileName, outputPath })


    // Check if the file already exitsts
    try {
      const info = await supabase.storage
      .from(BUCKET)
      .list(userIdFileName, { limit: 1 });

      const { data: dataBucket, error }  = info

      if (dataBucket && Boolean(dataBucket.toString())) {
        logger.log("data exists")
        return {
          message: `file already exists ${fileName}`
        }
      }

      if (error) {
        logger.log('error getting bucket data', { error })
        throw error
      }

    } catch(e) {
      logger.log(`Error checking bucket ${e}`)
      throw `Error checking bucket ${e}`
    }


    // Get audio from text 
    let res = null
    let fullPath = null
    try {
      res = await textToSpeech(text, {
        voiceId: audioCharacter.voice_id,
        fileName: outputPath
      })
    } catch(e) {
      throw `Error text to speeach ${e}`
    }
    
    logger.log("res", { res })
    
    if (audioProviderName !== 'test') {
      const fileData = fs.readFileSync(outputPath); 
      
      // Store result in supbabase storage
      try {
        const { data: dataStorage, error: errorStorage } = await supabase.storage
          .from(BUCKET) // Replace with your bucket name
          .upload(userIdFileName, fileData, {
            contentType: 'mp3',
          });

          
          fullPath = dataStorage?.path

        logger.log('dataStorage', { dataStorage });

        logger.log('DATA FROM UPLOAD', { dataStorage })
        logger.log('voiceVersion.id', { versionId: voiceVersion.id })
        // Duplicate 
        if (errorStorage && errorStorage.statusCode !== '409' ) {
          logger.log('errorStorage', { errorStorage })
          throw errorStorage
        }
      } catch(e) {
        throw `Error sending data ${e}`
      } finally {
        logger.log('file unlinked');
        fs.unlinkSync(outputPath)
      }


      logger.log("befroe update audio version")
      
      if (!fullPath) return {
        message: 'fail',
        error: `fullPath does not exist`
      }
    } else {
      fullPath = res
    }

    // Update audio version record with audio url 
    try {
      const { data: dataStorage, error: errorAudio } = await supabase
      .from("audio_version")
      .update({
        // audio_file_url: 'dummypath',
        audio_file_url: fullPath,
        duration_in_seconds: res?.audioLengthInSeconds || 0
      })
      .eq("id", voiceVersion.id);
      
      // logger.log('DATA FROM UPLOAD', { dataStorage })
      // logger.log('voiceVersion.id', { versionId: voiceVersion.id })

      if (errorAudio) {
        console.log("error audioVersion", errorAudio)
        throw errorAudio;
      }
      
    } catch (e) {
      logger.log(`Error updating audio version ${e}`)
      throw `Error updating audio version ${e}`
    }

    return {
      message: 'success',
      error: null
    }
  }

});
