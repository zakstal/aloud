import { z } from "zod";

export const createScreenPlaySchema = z.object({
    screenPlayText: z.string().optional(),
});
