import { z } from "zod";

const vendorOrderStatusSchema = z.enum([
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
]);

export const updateVendorOrderStatusSchema = z.object({
  status: vendorOrderStatusSchema,
  note: z.string().trim().max(500).optional(),
});
