import { z } from "zod";

import { REVIEW_LIMITS } from "@/features/reviews/domain/types";

/** Provider reply: trimmed, 1 to 500 characters, the same limits as the server. */
export const replySchema = z.object({
  appointmentId: z.string().trim().min(1),
  text: z.string().trim().min(REVIEW_LIMITS.replyMin).max(REVIEW_LIMITS.replyMax),
});

export type ReplyInput = z.infer<typeof replySchema>;

export function isValidReplyText(text: string): boolean {
  return replySchema.shape.text.safeParse(text).success;
}
