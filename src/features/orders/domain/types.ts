export const VENDOR_ORDER_STATUS_VALUES = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type VendorOrderStatus = (typeof VENDOR_ORDER_STATUS_VALUES)[number];

export type VendorOrderLineItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPricePiastres: number;
  lineTotalPiastres: number;
  vendorId?: string | null;
  vendorStoreName?: string | null;
};

export type VendorStoreSnapshot = {
  vendorId: string;
  storeName: string | null;
  logoUrl: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
};

export const ORDER_HISTORY_ROLES = ["vendor", "admin", "system"] as const;

export type OrderHistoryRole = (typeof ORDER_HISTORY_ROLES)[number];

export type VendorOrderStatusEvent = {
  status: VendorOrderStatus;
  at: Date;
  byRole: OrderHistoryRole;
  note: string | null;
};

export type VendorOrder = {
  vendorOrderId: string;
  orderId: string;
  vendorId: string;
  buyerUid: string;
  buyerDisplayName: string | null;
  buyerPhone: string | null;
  status: VendorOrderStatus;
  holdState: "held" | null;
  heldReason: string | null;
  statusHistory: VendorOrderStatusEvent[];
  lineItems: VendorOrderLineItem[];
  itemCount: number;
  subtotalPiastres: number;
  deliveryFeePiastres: number;
  discountPiastres: number;
  totalPiastres: number;
  commissionRatePercent: number;
  commissionPiastres: number;
  netPiastres: number;
  /** Delivery fee split fields when present */
  feeBasePiastres?: number | null;
  platformFeePiastres?: number | null;
  vendorNetPiastres?: number | null;
  /** Fee model, coupon funding and deal type when present (sale ledger fields) */
  feeModel?: string | null;
  couponFunding?: string | null;
  dealType?: string | null;
  currency: "EGP";
  placedAt: Date;
  updatedAt: Date;
  vendorStoreName: string | null;
  store: VendorStoreSnapshot | null;
  fulfillmentOwner: "admin" | "vendor";
  adminEditable: boolean;
  deliveryAddress: string | null;
  paymentMethod: string | null;
  paymentStatus: string | null;
};

export type OrderDatePreset =
  | "any"
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "custom";

export type VendorOrderListFilter = {
  status?: VendorOrderStatus | "any";
  query?: string;
  datePreset?: OrderDatePreset;
  dateFrom?: string;
  dateTo?: string;
  cursor?: string;
  pageSize?: number;
};

export type VendorOrderListPage = {
  items: VendorOrder[];
  nextCursor: string | null;
  total: number;
};

export type UpdateVendorOrderStatusInput = {
  status: VendorOrderStatus;
  note?: string;
};
