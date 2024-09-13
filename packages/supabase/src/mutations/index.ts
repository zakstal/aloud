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



// Define the data types for input
interface CreateScreenplayInput {
  title: string;
  type: "movie" | "tv_show";
  characters: { name: string; lines: { text: string; order: number }[] }[];
  total_lines: number;
  screen_play_text: string;
}

export async function createScreenPlay(
  userId: string,
  data: CreateScreenplayInput
) {
  console.log('here 1', userId, data)
  const supabase = createClient();
  const { title, type, characters, total_lines, screen_play_text } = data;

  const screenplayInsert = {
    user_id: userId,
    title: title,
    type: type,
    total_lines,
    screen_play_text
    // total_lines: characters.reduce((sum, char) => sum + char.lines.length, 0),
  };

  try {
    const result = await supabase.from("users").select("*");
    console.log('results users', result)

    console.log('here 2')
    // Start a transaction
    const { data: screenplay, error: screenplayError } = await supabase
      .from("screenplays")
      .insert(screenplayInsert)
      .select("id")
      .single(); // Fetch the inserted screenplay's ID

    console.log("here 33", screenplay, screenplayError)
    if (screenplayError) {
      throw screenplayError;
    }

    return screenplay

    // const screenplayId = screenplay.id;

    // // Insert characters
    // const charactersInsert = characters.map((character) => ({
    //   screenplay_id: screenplayId,
    //   name: character.name,
    // }));

    // const { data: insertedCharacters, error: charactersError } = await supabase
    //   .from("characters")
    //   .insert(charactersInsert)
    //   .select("id, name"); // Fetch the inserted character IDs

    // if (charactersError) {
    //   throw charactersError;
    // }

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
