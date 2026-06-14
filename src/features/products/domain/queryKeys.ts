import type { ProductListFilter } from "./types";

export const productKeys = {
  all: ["products"] as const,
  list: (filter: ProductListFilter) =>
    ["products", "list", filter] as const,
  detail: (productId: string) =>
    ["products", "detail", productId] as const,
  inventory: (productId: string) =>
    ["products", "detail", productId, "inventory"] as const,
};
