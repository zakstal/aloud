import { z } from "zod";

export const getSingedUrlSchema = z.object({
  url: z.union([z.string(), z.array(z.string())]),
});
