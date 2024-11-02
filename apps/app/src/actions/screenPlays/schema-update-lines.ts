import { z } from "zod";

// Define the schema for a line object
const lineSchema = z.object({
  id: z.string(), 
  order: z.number(),
  text: z.string().nullable().optional(),
  type: z.string(),
  isDialog: z.union([z.boolean().nullable().optional(), z.string().nullable().optional()]),
  characterName: z.string().optional(),
});

const linCreatedeSchema = z.object({
  id: z.string().nullable().optional(), 
  order: z.number().nullable().optional(),
  text: z.string().nullable().optional(),
  type: z.string(),
  isDialog: z.union([z.boolean().nullable().optional(), z.string().nullable().optional()]),
  characterName: z.string().optional(),
});

const characterSchema = z.object({
  name: z.string(),
  gender: z.string().nullable().optional(),
});

// Create a schema for an array of lines
export const updateOrCreateLinesSchema = z.object({
  created: z.array(linCreatedeSchema),
  removed: z.array(lineSchema),
  updated: z.array(lineSchema),
  characters: z.array(characterSchema).optional(),
  screenplayId: z.string(),
});
