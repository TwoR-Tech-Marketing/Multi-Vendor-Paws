import "server-only";

import {
  FieldValue,
  Timestamp,
  type DocumentData,
  type DocumentSnapshot,
} from "firebase-admin/firestore";

import { APP_CURRENCY } from "@/features/products/domain/currency";
import {
  computeCommissionPiastres,
} from "@/features/financials/infrastructure/commission.admin.repository";
import type {
  VendorEarningsEntry,
  VendorEarningsPage,
  VendorEarningsSummary,
} from "@/features/financials/domain/types";
import type { VendorOrder } from "@/features/orders/domain/types";
import { getAdminFirestore } from "@/lib/firebase-admin";

const ENTRIES_SUBCOLLECTION = "entries";
const SUMMARY_COLLECTION = "vendorEarningsSummary";
const MAX_ENTRIES = 50;

type EarningsEntryDoc = {
  vendorId: string;
  type: VendorEarningsEntry["type"];
  amountPiastres: number;
  commissionPiastres: number;
  netPiastres: number;
  vendorOrderId?: string | null;
  orderId?: string | null;
  description?: string | null;
  currency: string;
  createdAt?: Timestamp;
  createdBy?: string;
};

type EarningsSummaryDoc = {
  vendorId: string;
  totalSalesPiastres: number;
  totalCommissionPiastres: number;
  netEarningsPiastres: number;
  pendingPayoutPiastres?: number;
  currency: string;
  updatedAt?: Timestamp;
};

function earningsEntriesCollection(vendorId: string) {
  return getAdminFirestore()
    .collection("vendorEarnings")
    .doc(vendorId)
    .collection(ENTRIES_SUBCOLLECTION);
}

function toEarningsEntry(snap: DocumentSnapshot<DocumentData>): VendorEarningsEntry {
  const data = snap.data() as EarningsEntryDoc;
  return {
    entryId: snap.id,
    vendorId: data.vendorId,
    type: data.type,
    amountPiastres: data.amountPiastres,
    commissionPiastres: data.commissionPiastres,
    netPiastres: data.netPiastres,
    vendorOrderId: data.vendorOrderId ?? null,
    orderId: data.orderId ?? null,
    description: data.description ?? null,
    currency: APP_CURRENCY,
    createdAt: data.createdAt?.toDate() ?? new Date(0),
  };
}

function emptySummary(vendorId: string): VendorEarningsSummary {
  return {
    vendorId,
    totalSalesPiastres: 0,
    totalCommissionPiastres: 0,
    netEarningsPiastres: 0,
    pendingPayoutPiastres: 0,
    currency: APP_CURRENCY,
    updatedAt: new Date(0),
  };
}

function toSummary(vendorId: string, snap: DocumentSnapshot<DocumentData>): VendorEarningsSummary {
  if (!snap.exists) return emptySummary(vendorId);
  const data = snap.data() as EarningsSummaryDoc;
  return {
    vendorId,
    totalSalesPiastres: data.totalSalesPiastres ?? 0,
    totalCommissionPiastres: data.totalCommissionPiastres ?? 0,
    netEarningsPiastres: data.netEarningsPiastres ?? 0,
    pendingPayoutPiastres: data.pendingPayoutPiastres ?? 0,
    currency: APP_CURRENCY,
    updatedAt: data.updatedAt?.toDate() ?? new Date(0),
  };
}

export async function getVendorEarningsPage(vendorId: string): Promise<VendorEarningsPage> {
  const db = getAdminFirestore();
  const [summarySnap, entriesSnap] = await Promise.all([
    db.collection(SUMMARY_COLLECTION).doc(vendorId).get(),
    earningsEntriesCollection(vendorId).get(),
  ]);

  const summary = toSummary(vendorId, summarySnap);
  const entries = entriesSnap.docs
    .map(toEarningsEntry)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, MAX_ENTRIES);

  return { summary, entries };
}

export function resolveSaleEarningAmounts(vendorOrder: VendorOrder): {
  amountPiastres: number;
  commissionPiastres: number;
  netPiastres: number;
} {
  const amountPiastres = vendorOrder.totalPiastres;
  const storedCommission = vendorOrder.commissionPiastres ?? 0;
  const commissionPiastres =
    storedCommission > 0
      ? storedCommission
      : vendorOrder.commissionRatePercent > 0
        ? computeCommissionPiastres(amountPiastres, vendorOrder.commissionRatePercent)
        : 0;

  const storedNet = vendorOrder.netPiastres ?? 0;
  const netPiastres =
    storedNet > 0 &&
    storedNet <= amountPiastres &&
    storedCommission > 0
      ? storedNet
      : amountPiastres - commissionPiastres;

  return { amountPiastres, commissionPiastres, netPiastres };
}

export async function recordSaleEarningForDeliveredOrder(
  vendorOrder: VendorOrder,
  actorUid: string,
): Promise<boolean> {
  const db = getAdminFirestore();
  const entriesRef = earningsEntriesCollection(vendorOrder.vendorId);
  const summaryRef = db.collection(SUMMARY_COLLECTION).doc(vendorOrder.vendorId);

  const existing = await entriesRef
    .where("vendorOrderId", "==", vendorOrder.vendorOrderId)
    .where("type", "==", "sale")
    .limit(1)
    .get();

  if (!existing.empty) return false;

  const { amountPiastres, commissionPiastres, netPiastres } =
    resolveSaleEarningAmounts(vendorOrder);

  await db.runTransaction(async (tx) => {
    const summarySnap = await tx.get(summaryRef);
    const entryRef = entriesRef.doc();

    tx.set(entryRef, {
      vendorId: vendorOrder.vendorId,
      type: "sale",
      amountPiastres,
      commissionPiastres,
      netPiastres,
      vendorOrderId: vendorOrder.vendorOrderId,
      orderId: vendorOrder.orderId,
      description: `Order ${vendorOrder.orderId.slice(0, 8).toUpperCase()}`,
      currency: APP_CURRENCY,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: actorUid,
    });

    const current = summarySnap.exists
      ? (summarySnap.data() as EarningsSummaryDoc)
      : {
          vendorId: vendorOrder.vendorId,
          totalSalesPiastres: 0,
          totalCommissionPiastres: 0,
          netEarningsPiastres: 0,
          pendingPayoutPiastres: 0,
        };

    tx.set(
      summaryRef,
      {
        vendorId: vendorOrder.vendorId,
        totalSalesPiastres: (current.totalSalesPiastres ?? 0) + amountPiastres,
        totalCommissionPiastres:
          (current.totalCommissionPiastres ?? 0) + commissionPiastres,
        netEarningsPiastres: (current.netEarningsPiastres ?? 0) + netPiastres,
        pendingPayoutPiastres:
          (current.pendingPayoutPiastres ?? 0) + netPiastres,
        currency: APP_CURRENCY,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  return true;
}

export async function getVendorEarningsSummary(
  vendorId: string,
): Promise<VendorEarningsSummary> {
  const snap = await getAdminFirestore().collection(SUMMARY_COLLECTION).doc(vendorId).get();
  return toSummary(vendorId, snap);
}
