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
        audio_screenplay_versions (
          id,
          version_number,
          audio_file_url,
          audio_version (
            audio_file_url,
            duration_in_seconds,
            lines (
              id,
              order
            )
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
    throw error;
  }
}

export async function getAudioVersionsByScreenplayId(screenplayVersionId: string) {
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
      .eq("audio_screenplay_version_id", screenplayVersionId); // Filter by screenplay_id

    if (error) {
      throw error;
    }

    return data;  // Return the fetched audio versions
  } catch (error) {
    console.error("Error fetching audio versions:", error);
    throw error;
  }
}
