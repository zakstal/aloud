import { logger } from "@v1/logger";
import { createClient } from "@v1/supabase/server";
import type { Database, Tables, TablesUpdate } from "../types";


export async function updateUser(userId: string, data: TablesUpdate<"users">) {
  const supabase = createClient();

  try {
    const result = await supabase.from("users").update(data).eq("id", userId);

    return result;
  } catch (error) {
    logger.error(error);

    throw error;
  }
}

interface CreateCharacersInput {
  screenplayId: string;
  characters: { name: string; likelyGender: string | null }[];
  supabase: any,
}

interface CreateLinesInput {
  screenplayId: string;
  insertedCharacters: {id: string; name: string}[];
  dialog: Dialog[];
  supabase: any,
  versionNumber: number;
}

async function createLines({
  dialog,
  supabase,
  screenplayId,
  insertedCharacters,
  versionNumber
}: CreateLinesInput) {

  // TODO creating is not idempotent atm. This needs to be updated to prevent duplicates
  console.time("lines prepare", dialog)
  if (!dialog) return null

  const nameCharacterIdMap =  insertedCharacters?.reduce((obj: { [key: string]: string }, charObj) => {
    obj[charObj.name] = charObj.id
    return obj
  }, {})

  const toInsertLines = dialog.map(({ characterName, text, isDialog, type, order, id, character_id  }: Dialog, index: number) => {
    const characterId = character_id ? character_id : nameCharacterIdMap && nameCharacterIdMap[characterName]

    const obj = {
      screenplay_id: screenplayId,
      character_id: characterId,
      isDialog,
      type, 
      text,
      order: order || index,
      created_version_number: versionNumber,
    }

    if (id) {
      obj.id = id
    }
    
    return obj
  }).filter(Boolean)

  console.log('toInsertLines', toInsertLines)

  console.timeEnd("lines prepare")
  try {
    console.time("lines insert")
    const { data, errorInsert } = toInsertLines 
      ? await supabase
        .from("lines")
        .upsert(toInsertLines, { onConflict: 'id'})
      : {} // Optionally, return the inserted data
      
      if (errorInsert) {
        console.log("error lines", errorInsert)
        throw errorInsert;
      }

      const { data: insertedData, errorGetLines } = toInsertLines 
      ? await supabase
        .from("lines")
        .select("id, character_id, isDialog")
      : {} // Optionally, return the inserted

      if (errorGetLines) {
        console.log("error lines", errorGetLines)
        throw errorGetLines;
      }

    return insertedData;
  } catch (error) {
    console.error("Error inserting line:", error);
    throw error;
  }
}

async function insertCharacters ({
  characters,
  screenplayId,
  supabase,
}: CreateCharacersInput) {
  if (!characters || !characters?.length) return null
  const charactersInsert = characters && characters.map((obj) => {
    const update = {
      screenplay_id: screenplayId,
      name: obj.name,
      gender: obj?.likelyGender || obj?.gender,
    }

    if (obj.id) {
      update.id = obj.id
    }

    return update
});

  console.log('charactersInsert', charactersInsert)
  
  const { data: insertedCharacters, error: charactersError } = charactersInsert 
  ? await supabase
    .from("characters")
    .upsert(charactersInsert, { onConflict: 'id'})
    .select("id, name, audio_character_version_id")
  : {}


    console.log('insertedCharacters', insertedCharacters)
    console.log('charactersError', charactersError)
  if (charactersError) {
    throw charactersError;
  }



  return insertedCharacters
}

interface CreateCharacersVersionInput {
  screenplayVersionId: string;
  insertedCharacters: { id: string; }[] | null;
  supabase: any,
}

async function insertCharacterVersions ({
  insertedCharacters,
  screenplayVersionId,
  supabase
}: CreateCharacersVersionInput) {
  if (!insertedCharacters || !insertedCharacters?.length) return null

  console.log("insertedCharacters===", insertedCharacters)
  const characterVersionInsert = insertedCharacters?.map(insertedChar => ({
    audio_screenplay_version_id: screenplayVersionId,
    character_id: insertedChar.id,
    version_number: 1,
    voice_data: null,
    voice_id: null,
    voice_name: null
  }))

  console.log("characterVersionInsert---", characterVersionInsert)
  
  // const { data: insertedAudioCharacters, error: audiocharactersError } = await supabase
  // .from("audio_character_version")
  // .insert(characterVersionInsert)
  // .select("id, character_id")

  const { data: insertedAudioCharacters, error: audiocharactersError } = await supabase.rpc('insert_audio_character_versions_if_not_exists', {
    versions: characterVersionInsert
  });

  if (audiocharactersError) {
    console.log('audiocharactersError', audiocharactersError)
    throw audiocharactersError;
  }

  return insertedAudioCharacters
}

async function updateAudioScreenplayVersionTotalLines(screenplayId: string, audioScreenplayVersionId: string) {
  try {
    const supabase = createClient();

    const { data , error: countError } = await supabase.rpc('get_line_counts', { screenplayid: screenplayId });

    const { complete_count, incomplete_count} = (data?.length && data[0]) || {}
    if (countError) throw countError;

    // Step 3: Update the total_lines in the audio_screenplay_versions table

    const inputData = {
      total_lines: incomplete_count,
      total_lines_completed: complete_count,
    }

    const isComplete = incomplete_count === 0

    if (isComplete) {
      inputData.status = 'full'
    }
    const { data: updateData, error: updateError } = await supabase
      .from('audio_screenplay_versions')
      .update(inputData)
      .eq('id', audioScreenplayVersionId);

    if (updateError) throw updateError;

    return updateData;
  } catch (error) {
    console.error('Error updating total_lines:', error);
  }
}


type Dialog = { characterName: string; text: string, isDialog: boolean, type: string }
type Fountain = { type: string; text: string, scene_number: number | null }
// Define the data types for input
interface CreateScreenplayInput {
  id: string | null | undefined;
  title: string;
  type: "movie" | "tv_show";
  characters: { name: string; likelyGender: string | null }[];
  total_lines: number;
  screen_play_text: string;
  screen_play_fountain: Fountain[];
  dialog: Dialog[];
}

export async function createScreenPlay(
  userId: string,
  data: CreateScreenplayInput
) {
  console.log('here 1 supabase')
  const supabase = createClient();
  console.log('here 2 supabase')
  const { title, type, characters, total_lines, screen_play_text, dialog, screen_play_fountain } = data;
  
  console.log('here 3 supabase', characters)
  const screenplayInsert = {
    user_id: userId,
    title: title || 'New script',
    type: type,
    total_lines,
    screen_play_text,
    screen_play_fountain: screen_play_fountain
    // total_lines: characters.reduce((sum, char) => sum + char.lines.length, 0),
  };


  try {
  
    console.time('Screen play insert')
    // Start a transaction
    const { data: screenplay, error: screenplayError } = await supabase
      .from("screenplays")
      .insert(screenplayInsert)
      .select("id")
      .single(); // Fetch the inserted screenplay's ID
    
   
    if (screenplayError) {
      throw screenplayError;
    }

    console.log('here aa supabase')

    const screenplayId = screenplay.id;

    const { data: screenplayVersion, error: screenplayVersionError } = await supabase
      .from("audio_screenplay_versions")
      .insert({
        screenplay_id: screenplayId,
        version_number: 1,
        audio_file_url: 'n/a',
        is_final: false,
        status: 'unstarted'
      })
      .select("id")
      .single(); // Fetch the inserted screenplay's ID

    if (screenplayVersionError) {
      throw screenplayVersionError;
    }
    console.timeEnd('Screen play insert')
 
    console.time('Character insert')
    const isNarrator = characters?.some(character => character.name === 'Narrator')
    if (!isNarrator) {
      characters.push({
        name: 'Narrator',
        likelyGender: null
      })
    }

    const insertedCharacters = await insertCharacters({
      characters,
      screenplayId,
      supabase
    })

    console.log('insertedCharacters', insertedCharacters)

    console.timeEnd('Character insert')

    console.time('Character version insert')
    const insertedAudioCharactersVersions = await insertCharacterVersions({
      insertedCharacters,
      screenplayVersionId: screenplayVersion.id,
      supabase
    })

    const { data: datachar, error: errorChar} = await supabase
    .from('characters')
    .select('id, audio_character_version_id')
    .eq("screenplay_id", screenplayId)

    console.log('datachar--', datachar)
    console.log('errorChar--', errorChar )

    console.timeEnd('Character version insert')
    console.time('Create lines insert')
    
    await createLines({
      insertedCharacters,
      screenplayId: screenplayId,
      dialog,
      supabase,
      versionNumber: 1,
    })

    console.timeEnd('Create lines insert')

    await updateAudioScreenplayVersionTotalLines(screenplayId, screenplayVersion.id)

    return screenplay
    
  } catch (error) {
    logger.error(error);
    console.log('error', error);
    throw error;
  }
}


export async function updateAudioCharacterVersion(
  audioCharacterVersionId: string,
  data: { voice_id: string | undefined, voice_data: JSON, voice_name: string | undefined}
) {
  const supabase = createClient();
  try {
    const { data: updatedData, error } = await supabase
      .from("audio_character_version")
      .update(data)
      .eq("id", audioCharacterVersionId)
      .select('character_id')
      .single()

    if (error) {
      console.log("audio_character_version", error)
      throw new Error(error);
    }

    const character = supabase
      .from('characters')
      .select(`
          id,
          name,
          gender,
          created_at,
          audio_character_version!fk_audio_character_version (
            id,
            audio_screenplay_version_id,
            version_number,
            voice_data,
            voice_id,
            voice_name,
            created_at
          )
        `)
      .eq('id', updatedData.character_id)
      .single()

    return character;
  } catch (error) {
    console.error("Error updating audio_character_version:", error);
    throw error;
  }
}

export async function deleteScreenplay(screenplayId: string) {
  const supabase = createClient();

  console.log('screenplayId delete', screenplayId)

  try {
    // Delete the screenplay and associated data (via ON DELETE CASCADE foreign keys)
    const { data, error } = await supabase
      .from("screenplays")
      .delete()
      .eq("id", screenplayId)

    if (error) {
      console.log("screenplays", error)
      throw error;
    }

    return data;  // Return the deleted screenplay (if needed)
  } catch (error) {
    console.error("Error deleting screenplay and associated data:", error);
    throw error;
  }
}


export async function createJobsForScreenPlayVersion(screenplayVersionId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("audio_version")
      .select(`
        id,
        lines (
          id,
        ),
        audio_character_version (
          id,
        ),
        audio_jobs (
          id,
          job_status
        )
      `)
      .eq("audio_screenplay_version_id", screenplayVersionId); // Filter by screenplay_id

      const toInsertJob = data?.map(obj => {
        if (obj.audio_jobs?.length && obj.audio_jobs.some(job => ['in progress', 'pending'].includes(job.job_status))) return null
        return {
          audio_version_id: obj.id,
          line_id: obj.lines.id,
          audio_character_version_id: obj.audio_character_version.id
        }
      }).filter(Boolean)


      if (error) {
        console.log("audio_version", error)
        throw error;
      }

      const { data: insertedData, errorJobs } = await supabase
        .from("audio_jobs")
        .insert(toInsertJob)
        .select(`
          id,
          job_status,
          audio_version (
            id,
            screenplay_id,
            audio_file_url,
            version_number,
            created_at,
            audio_screenplay_version_id,
            audio_character_version_id,
          ),
          lines (
            id,
            text,
            order
          ),
          audio_character_version (
            id,
            version_number,
            voice_data,
            voice_id,
            voice_name
          )
        `);

    if (errorJobs) {
      console.log("error jobs", error)
      throw errorJobs;
    }

    return insertedData;  // Return the fetched audio versions
  } catch (error) {
    console.error("Error fetching audio versions:", error);
    throw error;
  }
}

export async function updateAudioVersionUrl(audioVersionId: string, newAudioFileUrl: string, durationInSeconds: number) {
  const supabase = createClient();
  console.log('audioVersionId', audioVersionId)
  console.log('newAudioFileUrl', newAudioFileUrl)
  try {
    const { data, error } = await supabase
      .from("audio_version")
      .update({
        audio_file_url: newAudioFileUrl,
        duration_in_seconds: durationInSeconds
      })
      .eq("id", audioVersionId);

    if (error) {
      console.log("error audioVersion", error)
      throw error;
    }

    return data;  // Return the updated audio version
  } catch (error) {
    console.error("Error updating audio_file_url:", error);
    throw error;
  }
}



export async function bumpAudioScreenplayVersion(screenplayId) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('bump_audio_screenplay_version', {
    screenplayid: screenplayId,
  });

  if (error) {
    console.error('Error bumping version:', error);
    throw error;
  }

  return data;  // This is the new version ID
}


export async function processLines({ created, removed, updated, characters = [], screenplayId, screenPlayVersionId, versionNumber }) {
  const supabase = createClient();

  try {
    // 1. Insert new lines
    if (created.length > 0) {
      console.log("insertCharacters---")
      const insertedCharacters = await insertCharacters({
        characters,
        screenplayId,
        supabase
      })

      console.log("insertCharacterVersions---")
      const insertedAudioCharactersVersions = await insertCharacterVersions({
        insertedCharacters,
        screenplayVersionId: screenPlayVersionId,
        supabase
      })

      console.log('insertedAudioCharactersVersions--', insertedAudioCharactersVersions)

      // TODO creating is not idempotent atm. This needs to be updated to prevent duplicates
      await createLines({
        insertedCharacters,
        screenplayId: screenplayId,
        dialog: created,
        supabase,
        versionNumber
      })
    }

    // 2. Mark lines as deleted (update "deleted" column to true)
    if (removed.length > 0) {
      const { error: removeError } = await Promise.all(
        removed.map(async (line) => {
          return await supabase
            .from('lines')
            .update({ deleted: true }) // Set deleted to true
            .eq('id', line.id);
        })
      );

      if (removeError) {
        throw new Error(`Error marking lines as deleted: ${removeError.message}`);
      }
    }

    // 3. Update existing lines with new values
    if (updated.length > 0) {
      const { error: updateError } = await Promise.all(
        updated.map(async (line) => {
          return await supabase
            .from('lines')
            .update({
              text: line.text,
              type: line.type,
              isDialog: line.isDialog,
              order: line.order,
              character_id: line.character_id,
            })
            .eq('id', line.id);
        })
      );

      if (updateError) {
        throw new Error(`Error updating lines: ${updateError.message}`);
      }
    }

    console.log('All operations completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error processing lines:', error);
    return { success: false, error: error.message };
  }
}


// TODO creating is not idempotent atm. This needs to be updated to prevent duplicates
export async function updateOrCreateLinesInDb(created: Dialog[], removed: Dialog[], updated: Dialog[], characters: CharacterData[], screenplayId: string, versionNumber: number) {
  console.log('created--------------------', created)
  console.log('removed--------------------', removed)
  console.log('updated--------------------', updated)
  console.log('characters--------------------', characters)
  console.log('screenplayId--------------------', screenplayId)
  const supabase = createClient();

  const screenPlayVersionId = await bumpAudioScreenplayVersion(screenplayId)
  const { data, error }  = await supabase
    .from("audio_screenplay_versions")
    .select(`
      status,
      id,
      total_lines,
      total_lines_completed,
      version_number,
      audio_file_url
    `)
    .eq('id', screenPlayVersionId)
    .single()

    if (error) {
      console.log("error updating lines", error)
      throw error;
    }

    const versionNumberNew =  Number(data.version_number)
    versionNumber

    // if changes are made off of an old version, set old version to current 
    // bumpAudioScreenplayVersion needs to be run first
    if (versionNumberNew - 1 !== versionNumber && versionNumber !> versionNumberNew) {
      const { data: dataSet, error: errorSet } = await supabase.rpc('set_version_to_current', {
        screenplayid: screenplayId,
        versionnumber: versionNumberNew
      });
      
      if (errorSet) {
        console.log("error updating lines", errorSet)
        throw errorSet;
      }
    }

  console.log('screenPlayVersionId--------------------', screenPlayVersionId, data)



  const res = await processLines({ created, removed, updated, characters, screenplayId, screenPlayVersionId, versionNumber: versionNumberNew })

  await updateAudioScreenplayVersionTotalLines(screenplayId, screenPlayVersionId)

  if (res.error) {
    return res
  }

  return data
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
