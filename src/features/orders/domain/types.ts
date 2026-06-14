export type VendorOrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type VendorOrderLineItem = {
  productId: string;
  name: string;
  imageUrl: string | null;
  quantity: number;
  unitPricePiastres: number;
  lineTotalPiastres: number;
};

export type VendorOrderStatusEvent = {
  status: VendorOrderStatus;
  at: Date;
  by: string;
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
  currency: "EGP";
  placedAt: Date;
  updatedAt: Date;
  vendorStoreName: string | null;
  deliveryAddress: string | null;
  paymentMethod: string | null;
};

export type VendorOrderListFilter = {
  status?: VendorOrderStatus | "any";
  cursor?: string;
  pageSize?: number;
};

export type VendorOrderListPage = {
  items: VendorOrder[];
  nextCursor: string | null;
};

export type UpdateVendorOrderStatusInput = {
  status: VendorOrderStatus;
  note?: string;
};
