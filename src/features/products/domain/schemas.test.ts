import { describe, expect, it } from "vitest";

import { createProductSchema } from "@/features/products/domain/schemas";

const validProduct = {
  name: "Dog food",
  imageUrls: ["https://example.com/a.jpg"],
  primaryImageUrl: "https://example.com/a.jpg",
  categoryIds: ["food"],
  primaryCategoryId: "food",
  pricePiastres: 1500,
  stock: 4,
  status: "active",
};

describe("createProductSchema", () => {
  it("accepts a product priced in piastres", () => {
    expect(createProductSchema.parse(validProduct)).toMatchObject({
      name: "Dog food",
      pricePiastres: 1500,
      stock: 4,
    });
  });

  it("rejects a sale price that is not lower than the regular price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      priceAfterDiscountPiastres: 1500,
    });
    expect(result.success).toBe(false);
  });

  it("rejects a primary image that is not in the uploaded list", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      primaryImageUrl: "https://example.com/missing.jpg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a fractional piastre price", () => {
    const result = createProductSchema.safeParse({
      ...validProduct,
      pricePiastres: 10.5,
    });
    expect(result.success).toBe(false);
  });
});
