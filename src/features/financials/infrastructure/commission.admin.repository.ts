import "server-only";

import { Timestamp } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase-admin";

const COMMISSION_CONFIG_DOC = "main";
const DEFAULT_COMMISSION_PERCENT = 10;

type CommissionConfigDoc = {
  defaultCommissionPercent?: number;
  vendorOverrides?: Record<string, number>;
};

export async function resolveCommissionRatePercent(vendorId: string): Promise<number> {
  const snap = await getAdminFirestore()
    .collection("commissionConfig")
    .doc(COMMISSION_CONFIG_DOC)
    .get();

  if (!snap.exists) return DEFAULT_COMMISSION_PERCENT;

  const data = snap.data() as CommissionConfigDoc;
  const override = data.vendorOverrides?.[vendorId];
  if (typeof override === "number" && override >= 0 && override <= 100) {
    return override;
  }

  const defaultRate = data.defaultCommissionPercent;
  if (typeof defaultRate === "number" && defaultRate >= 0 && defaultRate <= 100) {
    return defaultRate;
  }

  return DEFAULT_COMMISSION_PERCENT;
}

export async function ensureDefaultCommissionConfig(): Promise<void> {
  const ref = getAdminFirestore().collection("commissionConfig").doc(COMMISSION_CONFIG_DOC);
  const snap = await ref.get();
  if (snap.exists) return;

  await ref.set({
    defaultCommissionPercent: DEFAULT_COMMISSION_PERCENT,
    vendorOverrides: {},
    updatedAt: Timestamp.now(),
  });
}

export function computeCommissionPiastres(
  totalPiastres: number,
  commissionRatePercent: number,
): number {
  return Math.round((totalPiastres * commissionRatePercent) / 100);
}
