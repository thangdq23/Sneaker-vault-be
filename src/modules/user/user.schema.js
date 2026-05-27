import { z } from "zod";

export const updateProfileSchema = {
  body: z.object({
    name: z.string().trim().min(3, "Name must be at least 3 characters").optional(),
  }),
};
