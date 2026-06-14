import { z } from "zod";

const piastresSchema = z
  .number()
  .int("Price must be a whole number of piastres.")
  .nonnegative("Price cannot be negative.")
  .max(1_000_000_00, "Price exceeds the allowed maximum.");

const stockSchema = z
  .number()
  .int("Stock must be a whole number.")
  .nonnegative("Stock cannot be negative.")
  .max(1_000_000, "Stock exceeds the allowed maximum.");

const productStatusSchema = z.enum([
  "active",
  "inactive",
  "out_of_stock",
  "archived",
]);

const arrayOfNonEmptyStringsSchema = z
  .array(z.string().trim().min(1))
  .min(1, "At least one item is required.")
  .max(20);

export const createProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    nameAr: z.string().trim().min(2).max(120).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    descriptionAr: z.string().trim().max(2000).nullable().optional(),
    imageUrls: arrayOfNonEmptyStringsSchema.max(8),
    primaryImageUrl: z.string().trim().min(1),
    categoryIds: arrayOfNonEmptyStringsSchema.max(5),
    primaryCategoryId: z.string().trim().min(1),
    pricePiastres: piastresSchema,
    priceAfterDiscountPiastres: piastresSchema.nullable().optional(),
    stock: stockSchema,
    lowStockThreshold: stockSchema.nullable().optional(),
    sku: z.string().trim().max(64).nullable().optional(),
    status: productStatusSchema,
    tags: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  })
  .refine((v) => v.imageUrls.includes(v.primaryImageUrl), {
    path: ["primaryImageUrl"],
    message: "Primary image must be one of the uploaded images.",
  })
  .refine((v) => v.categoryIds.includes(v.primaryCategoryId), {
    path: ["primaryCategoryId"],
    message: "Primary category must be one of the selected categories.",
  })
  .refine(
    (v) =>
      v.priceAfterDiscountPiastres == null ||
      v.priceAfterDiscountPiastres < v.pricePiastres,
    {
      path: ["priceAfterDiscountPiastres"],
      message: "Sale price must be lower than the regular price.",
    },
  );

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    nameAr: z.string().trim().min(2).max(120).nullable().optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    descriptionAr: z.string().trim().max(2000).nullable().optional(),
    imageUrls: z.array(z.string().trim().min(1)).min(1).max(8).optional(),
    primaryImageUrl: z.string().trim().min(1).optional(),
    categoryIds: z.array(z.string().trim().min(1)).min(1).max(5).optional(),
    primaryCategoryId: z.string().trim().min(1).optional(),
    pricePiastres: piastresSchema.optional(),
    priceAfterDiscountPiastres: piastresSchema.nullable().optional(),
    stock: stockSchema.optional(),
    lowStockThreshold: stockSchema.nullable().optional(),
    sku: z.string().trim().max(64).nullable().optional(),
    status: productStatusSchema.optional(),
    tags: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, {
    message: "At least one field must change.",
  });

export type CreateProductPayload = z.infer<typeof createProductSchema>;
export type UpdateProductPayload = z.infer<typeof updateProductSchema>;
