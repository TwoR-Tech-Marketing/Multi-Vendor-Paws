import type { ReviewTagId } from "@/features/reviews/domain/types";

/** "45%" with Western digits in both languages. */
export function formatPercent(percent: number): string {
  return `${Math.trunc(percent)}%`;
}

/** Most used tags first, ties by id, zero counts dropped. */
export function topTags(
  tagCounts: Partial<Record<ReviewTagId, number>>,
  limit = 3,
): { id: ReviewTagId; count: number }[] {
  return (Object.entries(tagCounts) as [ReviewTagId, number][])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([id, count]) => ({ id, count }));
}
