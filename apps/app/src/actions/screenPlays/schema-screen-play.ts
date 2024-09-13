import { z } from "zod";

export const screenPlaySchema = z.object({
  screenPlayId: z.string(),
});
