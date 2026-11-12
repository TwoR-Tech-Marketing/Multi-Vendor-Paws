import type { VendorReview } from "@/features/reviews/domain/types";

/**
 * The list after a reply. The server copy wins when it came back; otherwise
 * the row keeps its data, shows `text` as the reply and can't be replied again.
 */
export function applyReply(
  items: VendorReview[],
  appointmentId: string,
  updated: VendorReview | null,
  text: string,
): VendorReview[] {
  return items.map((item) => {
    if (item.appointmentId !== appointmentId) return item;
    if (updated?.appointmentId === appointmentId && updated.reply) return { ...updated, canReply: false };
    return { ...item, reply: text.trim() ? { text: text.trim(), createdAtMs: null } : item.reply, canReply: false };
  });
}
