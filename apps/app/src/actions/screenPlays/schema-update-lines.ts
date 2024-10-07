import { z } from "zod";

// Define the schema for a line object
const lineSchema = z.object({
  text: z.string().optional(),
  type: z.string(),
  isDialog: z.boolean().optional(),
  characterName: z.string().optional(),
});

// Create a schema for an array of lines
export const updateOrCreateLinesSchema = z.object({
  lines: z.array(lineSchema),
});
