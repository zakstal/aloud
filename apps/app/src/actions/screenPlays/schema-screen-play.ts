import { z } from "zod";

export const screenPlaySchema = z.object({
  screenPlayId: z.string(),
  versionNumber: z.number().nullable().optional(),
});
