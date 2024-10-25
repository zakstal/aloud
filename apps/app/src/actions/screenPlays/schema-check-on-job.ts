import { z } from "zod";

export const checkOnJobSchema = z.object({
    audioVersionId: z.string(),
});