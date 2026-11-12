import { httpsCallable } from "firebase/functions";

import {
  PAYOUT_CYCLES,
  type PayoutCycle,
  type StatementPayout,
  type StatementPeriod,
  type VendorStatement,
} from "@/features/financials/domain/statement-types";
import { firebaseFunctions } from "@/lib/firebase";

const CALLABLE_STATEMENT = "vendor_payouts-getMyVendorStatement";
export const STATEMENT_PERIOD_COUNT = 6;

type Raw = Record<string, unknown>;

function asRecord(value: unknown): Raw | null {
  return value && typeof value === "object" ? (value as Raw) : null;
}

function toInt(value: unknown): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : 0;
}

function toOptionalInt(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) ? n : null;
}

function toText(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function toCycle(value: unknown): PayoutCycle {
  return PAYOUT_CYCLES.find((cycle) => cycle === value) ?? "monthly";
}

function mapPayout(raw: unknown, index: number): StatementPayout | null {
  const item = asRecord(raw);
  if (!item) return null;
  return {
    entryId: toText(item.entryId) ?? `payout_${index}`,
    periodKey: toText(item.periodKey),
    amountPiastres: Math.abs(toInt(item.amountPiastres)),
    transferReference: toText(item.transferReference),
    paidAtMs: toOptionalInt(item.paidAtMs),
    createdAtMs: toInt(item.createdAtMs),
  };
}

function mapPeriod(raw: unknown): StatementPeriod | null {
  const item = asRecord(raw);
  const periodKey = item ? toText(item.periodKey) : null;
  if (!item || !periodKey) return null;
  const payouts = Array.isArray(item.payouts)
    ? item.payouts
        .map(mapPayout)
        .filter((payout): payout is StatementPayout => payout !== null)
    : [];
  return {
    periodKey,
    startMs: toInt(item.startMs),
    endMs: toInt(item.endMs),
    closed: item.closed === true,
    openingPiastres: toInt(item.openingPiastres),
    salesPiastres: toInt(item.salesPiastres),
    feesPiastres: toInt(item.feesPiastres),
    refundsPiastres: toInt(item.refundsPiastres),
    adjustmentsPiastres: toInt(item.adjustmentsPiastres),
    payoutsPiastres: toInt(item.payoutsPiastres),
    closingPiastres: toInt(item.closingPiastres),
    payouts,
  };
}

/** Maps the statement callable response; unusable periods are dropped. */
export function mapVendorStatement(raw: unknown): VendorStatement {
  const data = asRecord(raw) ?? {};
  const periods = Array.isArray(data.periods)
    ? data.periods
        .map(mapPeriod)
        .filter((period): period is StatementPeriod => period !== null)
    : [];
  return {
    cycle: toCycle(data.cycle),
    currentBalancePiastres: toInt(data.currentBalancePiastres),
    periods,
  };
}

export async function fetchVendorStatement(
  periodCount: number = STATEMENT_PERIOD_COUNT,
): Promise<VendorStatement> {
  const callable = httpsCallable(firebaseFunctions, CALLABLE_STATEMENT);
  const result = await callable({ periodCount });
  return mapVendorStatement(result.data);
}
