import { z } from "zod";

import { VENDOR_ORDER_STATUS_VALUES } from "@/features/orders/domain/types";

const vendorOrderStatusSchema = z.enum(VENDOR_ORDER_STATUS_VALUES);

export const updateVendorOrderStatusSchema = z.object({
  status: vendorOrderStatusSchema,
  note: z.string().trim().max(500).optional(),
});
