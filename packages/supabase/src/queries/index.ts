import { logger } from "@v1/logger";
import { createClient } from "@v1/supabase/server";

export async function getUser() {
  const supabase = createClient();

  try {
    const result = await supabase.auth.getUser();

    return result;
  } catch (error) {
    logger.error(error);

    throw error;
  }
}

export async function getPosts() {
  const supabase = createClient();

  try {
    const result = await supabase.from("posts").select("*");

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export async function getScreenPlays(screenPlayId) {
  const supabase = createClient();

  try {
    const result = await supabase
      .from("screenplays")
      .select("title, created_at, id")

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
export async function getScreenPlay(screenPlayId) {
  const supabase = createClient();

  console.time('Get screenpaly')
  try {
    const result = await supabase
      .from("screenplays")
      .select(`
        id,
        title,
        type,
        created_at,
        screen_play_text,
        screen_play_fountain,
        lines (
          id,
          order,
          type,
          text,
          isDialog,
          characters (
            id,
            name
          )
        ),
        audio_screenplay_versions (
          status,
          id,
          total_lines,
          total_lines_completed,
          version_number,
          audio_file_url,
          audio_version (
            id,
            line_id,
            audio_file_url,
            duration_in_seconds
          )
        ),
        characters (
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
        )
      `)
      .eq('id', screenPlayId)
      .single();

    
    return result;
  } catch (error) {
    logger.error(error);
    console.log("error--------", error)
    throw error;
  } finally {
    console.timeEnd('Get screenpaly')
  }
}

export async function getAudioVersionsByScreenplayId(screenplayVersionId: string, minOrderNumber: number = 0) {
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
          deleted
        ),
        audio_character_version (
          id,
          version_number,
          voice_data,
          voice_id,
          voice_name
        )
      `)
      .eq("audio_screenplay_version_id", screenplayVersionId) // Filter by screenplay_id
      .eq('lines.deleted', false) 
      .is("audio_file_url", null)
      .order("lines(order)", { ascending: false });

    if (error) {
      throw error;
    }

    return data;  // Return the fetched audio versions
  } catch (error) {
    console.error("Error fetching audio versions:", error);
    throw error;
  }
}

export async function getAudioVersion(audioVersionId: string) {
  const supabase = createClient();
  try {
    const { data, error } = await supabase
      .from("audio_version")
      .select(`
        id,
        screenplay_id,
        audio_file_url,
        version_number,
        created_at,
        audio_screenplay_version_id,
        audio_character_version_id,
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
        ),
        audio_jobs (
          id,
          job_status
        )
      `)
      .eq("id", audioVersionId); // Filter by screenplay_id

    if (error) {
      throw error;
    }

    return data;  // Return the fetched audio versions
  } catch (error) {
    console.error("Error fetching audio versions:", error);
    throw error;
  }
}

const BUCKET = 'audio_version_lines'

/**
 * Generate signed URL for a file in Supabase Storage.
 * @param {string} bucketName - The name of the storage bucket.
 * @param {string} filePath - The path to the file in the bucket.
 * @param {number} expiresIn - The expiration time for the signed URL (in seconds).
 */
export async function getSignedUrl(filePath: string | string[], bucketName = BUCKET, expiresIn = 60 * 50) {
  const supabase = createClient();

  if (Array.isArray(filePath)) {

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrls(filePath, expiresIn);  // URL valid for `expiresIn` seconds (default: 5 minutes)


    if (error) {
      throw new Error(`Error generating signed URL: ${error.message}`);
    }

    return data;
  }

  const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, expiresIn);  // URL valid for `expiresIn` seconds (default: 5 minutes)

  if (error) {
    throw new Error(`Error generating signed URL: ${error.message}`);
  }

  return data.signedUrl;
}


export async function getScreenPlayAudioVersion(audioVersionId: string) {
  const supabase = createClient();
  console.log('Checking if audioVersionId is in progress:', audioVersionId);
  
  try {
    const { data, error } = await supabase
      .from("audio_screenplay_versions")
      .select("status, job_id, id, total_lines")
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
