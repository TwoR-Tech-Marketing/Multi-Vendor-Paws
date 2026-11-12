/** Two decimals is the finest percentage an admin can enter. */
const PERCENT_SCALE = 100;

/**
 * Display value of a deal percentage: rounded half up to two decimals,
 * Western digits, no trailing zeros (12.5, 10, 7.25). Bad input reads as 0.
 */
export function formatDealPercent(percentage: number): string {
  if (!Number.isFinite(percentage)) return "0";
  const sign = percentage < 0 ? -1 : 1;
  // toPrecision drops binary noise (9.995 * 100 is 999.4999...) before rounding.
  const scaled = Number((Math.abs(percentage) * PERCENT_SCALE).toPrecision(12));
  const rounded = (sign * Math.floor(scaled + 0.5)) / PERCENT_SCALE;
  return String(rounded === 0 ? 0 : rounded);
}
