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
  screenplayVersionId: string;
  insertedCharacters: {id: string; name: string}[];
  insertedAudioCharactersVersions: {id: string; character_id: string}[];
  dialog: Dialog[];
  supabase: any,
}

async function createLines({
  dialog,
  supabase,
  screenplayId,
  screenplayVersionId,
  insertedCharacters,
  insertedAudioCharactersVersions,
}: CreateLinesInput) {

  if (!dialog || !insertedCharacters || !insertedAudioCharactersVersions) return null

  const nameCharacterIdMap =  insertedCharacters.reduce((obj: { [key: string]: string }, charObj) => {
    obj[charObj.name] = charObj.id
    return obj
  }, {})

  const characterIdToInsertedIdMap = insertedAudioCharactersVersions.reduce((obj: { [key: string]: string }, charObj) => {
    obj[charObj.character_id] = charObj.id
    return obj
  }, {})

  const toInsertLines = dialog.map(({ characterName, text }: Dialog, index: number) => {
    const characterId = nameCharacterIdMap && nameCharacterIdMap[characterName]
    if (!characterId) return null

    return {
      screenplay_id: screenplayId,
      character_id: characterId,
      text,
      order: index,
    }
  }).filter(Boolean)


  try {
    const { data: insertedData, error } = toInsertLines 
      ? await supabase
        .from("lines")
        .insert(toInsertLines)
        .select("id, character_id")
      : {} // Optionally, return the inserted data
      
      if (error) {
        throw error;
      }

      const toInsertLineVersions = insertedData && insertedData.map((line: { id: string, character_id: string }) => ({
        line_id: line.id,
        version_number: 1,
        screenplay_id: screenplayId,
        audio_screenplay_version_id: screenplayVersionId,
        audio_character_version_id: characterIdToInsertedIdMap[line.character_id],
      }))

      const { data, error: audioVersionError } = toInsertLineVersions 
      ? await supabase
        .from("audio_version")
        .insert(toInsertLineVersions)
        .select("id") // Optionally, return the inserted data
      : {}

      if (audioVersionError) {
        throw audioVersionError;
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
  if (!characters || !characters.length) return null
  const charactersInsert = characters && characters.map((obj) => ({
    screenplay_id: screenplayId,
    name: obj.name,
    gender: obj?.likelyGender,
  }));

  
  const { data: insertedCharacters, error: charactersError } = charactersInsert 
  ? await supabase
    .from("characters")
    .insert(charactersInsert)
    .select("id, name")
  : {}


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
  if (!insertedCharacters || !insertedCharacters.length) return null

  const characterVersionInsert = insertedCharacters?.map(insertedChar => ({
    audio_screenplay_version_id: screenplayVersionId,
    character_id: insertedChar.id,
    version_number: 1
  }))
  
  const { data: insertedAudioCharacters, error: audiocharactersError } = await supabase
  .from("audio_character_version")
  .insert(characterVersionInsert)
  .select("id, character_id")

  if (audiocharactersError) {
    console.log('audiocharactersError', audiocharactersError)
    throw audiocharactersError;
  }

  return insertedAudioCharacters
}


type Dialog = { characterName: string; text: string }
type Fountain = { type: string; text: string, scene_number: number | null }
// Define the data types for input
interface CreateScreenplayInput {
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
  const { title, type, characters, total_lines, screen_play_text, dialog, screen_play_fountain } = data;

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
      })
      .select("id")
      .single(); // Fetch the inserted screenplay's ID

    if (screenplayVersionError) {
      throw screenplayVersionError;
    }
    console.log('here a supabase')
 
    const insertedCharacters = await insertCharacters({
      characters,
      screenplayId,
      supabase
    })

    console.log('here 2 supabase')
    const insertedAudioCharactersVersions = await insertCharacterVersions({
      insertedCharacters,
      screenplayVersionId: screenplayVersion.id,
      supabase
    })
    
    console.log('here 3 supabase')
    await createLines({
      insertedCharacters,
      insertedAudioCharactersVersions,
      screenplayId: screenplayId,
      screenplayVersionId: screenplayVersion.id,
      dialog,
      supabase,
    })


    return screenplay
    // // Insert lines for each character
    // const linesInsert = [];
    // insertedCharacters.forEach((character, index) => {
    //   const characterLines = characters[index].lines.map((line) => ({
    //     screenplay_id: screenplayId,
    //     character_id: character.id,
    //     text: line.text,
    //     order: line.order,
    //   }));
    //   linesInsert.push(...characterLines);
    // });

    // const { error: linesError } = await supabase.from("lines").insert(linesInsert);

    // if (linesError) {
    //   throw linesError;
    // }

    // logger.info("Screenplay, characters, and lines inserted successfully");

    // return { success: true, screenplayId };
  } catch (error) {
    logger.error(error);
    console.log('error', error);
    throw error;
  }
}


export async function updateAudioCharacterVersion(
  audioCharacterVersionId: string,
  data: { voice_id: string, voice_data: JSON, voice_name: string}
) {
  const supabase = createClient();
  console.log("data here ===============", data)
  try {
    const { data: updatedData, error } = await supabase
      .from("audio_character_version")
      .update(data)
      .eq("id", audioCharacterVersionId)
      .select('character_id')
      .single()

    if (error) {
      throw error;
    }

    const character = supabase
      .from('characters')
      .select(`
          id,
          name,
          gender,
          created_at,
          audio_character_version (
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


      console.log("error", error)
    if (error) {
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
        if (obj.audio_jobs.length && obj.audio_jobs.some(job => ['in progress', 'pending'].includes(job.job_status))) return null
        return {
          audio_version_id: obj.id,
          line_id: obj.lines.id,
          audio_character_version_id: obj.audio_character_version.id
        }
      }).filter(Boolean)


      if (error) {
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
      console.log("error", error)
      throw error;
    }

    return data;  // Return the updated audio version
  } catch (error) {
    console.error("Error updating audio_file_url:", error);
    throw error;
  }
}