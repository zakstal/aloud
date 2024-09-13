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
        characters (
          id,
          name,
          gender,
          created_at
        )
      `)
      .eq('id', screenPlayId);

    return result;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}
