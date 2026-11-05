import { z } from "zod";

export const portalSessionBodySchema = z.object({
  idToken: z.string().min(1),
});
