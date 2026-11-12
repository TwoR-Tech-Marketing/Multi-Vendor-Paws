import { beforeEach, describe, expect, it, vi } from "vitest";

import type { VendorOrder } from "@/features/orders/domain/types";

type Doc = Record<string, unknown>;

const store = vi.hoisted(() => ({
  docs: new Map<string, Doc>(),
  failVendorRead: false,
}));

vi.mock("server-only", () => ({}));
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: { serverTimestamp: () => "SERVER_TS" },
  Timestamp: class {},
}));

function docRef(path: string) {
  return {
    path,
    get: async () => {
      if (store.failVendorRead && path.startsWith("vendors/")) {
        throw new Error("read failed");
      }
      const data = store.docs.get(path);
      return { exists: data !== undefined, data: () => data };
    },
  };
}

function collectionRef(path: string) {
  return {
    doc: (id: string) => ({
      ...docRef(`${path}/${id}`),
      collection: (name: string) => collectionRef(`${path}/${id}/${name}`),
    }),
    where: () => ({
      where: () => ({ limit: () => ({ kind: "query", path }) }),
    }),
  };
}

vi.mock("@/lib/firebase-admin", () => ({
  getAdminFirestore: () => ({
    collection: (name: string) => collectionRef(name),
    runTransaction: async (
      fn: (tx: unknown) => Promise<boolean>,
    ): Promise<boolean> =>
      fn({
        get: async (ref: { kind?: string; path: string; get?: () => unknown }) => {
          if (ref.kind === "query") {
            const prefix = `${ref.path}/`;
            const hit = [...store.docs.keys()].some((key) => key.startsWith(prefix));
            return { empty: !hit };
          }
          return (ref as { get: () => unknown }).get();
        },
        create: (ref: { path: string }, data: Doc) => store.docs.set(ref.path, data),
        set: (ref: { path: string }, data: Doc) =>
          store.docs.set(ref.path, { ...(store.docs.get(ref.path) ?? {}), ...data }),
      }),
  }),
}));

import { recordSaleEarningForDeliveredOrder } from "@/features/financials/infrastructure/vendor-earnings.admin.repository";

const ENTRY = "vendorEarnings/vendor_a/entries/sale_vo_1";
const SUMMARY = "vendorEarningsSummary/vendor_a";

function order(overrides: Partial<VendorOrder> = {}): VendorOrder {
  return {
    vendorOrderId: "vo_1",
    orderId: "abcdefgh1234",
    vendorId: "vendor_a",
    buyerUid: "buyer_1",
    buyerDisplayName: null,
    buyerPhone: null,
    status: "delivered",
    holdState: null,
    heldReason: null,
    statusHistory: [],
    lineItems: [],
    itemCount: 1,
    subtotalPiastres: 10000,
    deliveryFeePiastres: 2000,
    discountPiastres: 0,
    totalPiastres: 12000,
    commissionRatePercent: 10,
    commissionPiastres: 0,
    netPiastres: 0,
    currency: "EGP",
    placedAt: new Date(0),
    updatedAt: new Date(0),
    vendorStoreName: null,
    store: null,
    fulfillmentOwner: "vendor",
    adminEditable: false,
    deliveryAddress: null,
    paymentMethod: null,
    paymentStatus: null,
    ...overrides,
  };
}

describe("recordSaleEarningForDeliveredOrder", () => {
  beforeEach(() => {
    store.docs.clear();
    store.failVendorRead = false;
  });

  it("skips a test order for a normal vendor", async () => {
    store.docs.set("vendors/vendor_a", { storeName: "A" });
    store.docs.set(SUMMARY, { totalSalesPiastres: 500 });

    await expect(recordSaleEarningForDeliveredOrder(order({ isTest: true }), "u1")).resolves.toBe(
      false,
    );
    expect(store.docs.has(ENTRY)).toBe(false);
    expect(store.docs.get(SUMMARY)).toEqual({ totalSalesPiastres: 500 });
  });

  it("skips a test order when the vendor read fails or the vendor is missing", async () => {
    store.failVendorRead = true;
    await expect(recordSaleEarningForDeliveredOrder(order({ isTest: true }), "u1")).resolves.toBe(
      false,
    );
    store.failVendorRead = false;
    await expect(recordSaleEarningForDeliveredOrder(order({ isTest: true }), "u1")).resolves.toBe(
      false,
    );
    expect(store.docs.has(ENTRY)).toBe(false);
    expect(store.docs.has(SUMMARY)).toBe(false);
  });

  it("stamps the row and the summary for a test order to a test vendor", async () => {
    store.docs.set("vendors/vendor_a", { isTest: true });

    await expect(recordSaleEarningForDeliveredOrder(order({ isTest: true }), "u1")).resolves.toBe(
      true,
    );
    expect(store.docs.get(ENTRY)).toMatchObject({
      type: "sale",
      vendorOrderId: "vo_1",
      isTest: true,
    });
    expect(store.docs.get(SUMMARY)).toMatchObject({ vendorId: "vendor_a", isTest: true });
  });

  it("stamps the row and the summary for a normal order to a test vendor", async () => {
    store.docs.set("vendors/vendor_a", { isTest: true });

    await expect(recordSaleEarningForDeliveredOrder(order(), "u1")).resolves.toBe(true);
    expect(store.docs.get(ENTRY)).toMatchObject({ isTest: true });
    expect(store.docs.get(SUMMARY)).toMatchObject({ isTest: true });
  });

  it("records a normal order to a normal vendor without any test flag", async () => {
    store.docs.set("vendors/vendor_a", { storeName: "A" });

    await expect(recordSaleEarningForDeliveredOrder(order(), "u1")).resolves.toBe(true);
    const entry = store.docs.get(ENTRY) as Doc;
    expect(entry).toMatchObject({ type: "sale", vendorOrderId: "vo_1" });
    expect("isTest" in entry).toBe(false);
    const summary = store.docs.get(SUMMARY) as Doc;
    expect("isTest" in summary).toBe(false);
    expect(summary.totalSalesPiastres).toBe(entry.amountPiastres);
    expect(summary.pendingPayoutPiastres).toBe(entry.netPiastres);
  });

  it("records a normal order unstamped when the vendor read fails", async () => {
    store.failVendorRead = true;

    await expect(recordSaleEarningForDeliveredOrder(order(), "u1")).resolves.toBe(true);
    expect("isTest" in (store.docs.get(ENTRY) as Doc)).toBe(false);
    expect("isTest" in (store.docs.get(SUMMARY) as Doc)).toBe(false);
  });
});
