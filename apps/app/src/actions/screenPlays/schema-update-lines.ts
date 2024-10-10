import { z } from "zod";

// Define the schema for a line object
const lineSchema = z.object({
  text: z.string().nullable().optional(),
  type: z.string(),
  isDialog: z.boolean().nullable().optional(),
  characterName: z.string().optional(),
});

const characterSchema = z.object({
  name: z.string(),
  gender: z.string().nullable().optional(),
});

// Create a schema for an array of lines
export const updateOrCreateLinesSchema = z.object({
  created: z.array(lineSchema),
  removed: z.array(lineSchema),
  updated: z.array(lineSchema),
  characters: z.array(characterSchema).optional(),
  screenplayId: z.string(),
});
