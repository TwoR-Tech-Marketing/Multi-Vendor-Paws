import type { ProductStatus } from "@/features/products/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

export type ProductListFilters = {
  status: ProductStatus | "any";
  categoryId: string;
};

export const EMPTY_PRODUCT_LIST_FILTERS: ProductListFilters = {
  status: "any",
  categoryId: "any",
};

export function countActiveProductFilters(filters: ProductListFilters): number {
  let count = 0;
  if (filters.status !== "any") count += 1;
  if (filters.categoryId !== "any") count += 1;
  return count;
}

export function getProductFilterChipLabels(
  filters: ProductListFilters,
  strings: AppStrings,
  categoryOptions: { value: string; label: string }[],
): string[] {
  const chips: string[] = [];
  if (filters.status !== "any") {
    chips.push(strings.products.statusLabels[filters.status as ProductStatus]);
  }
  if (filters.categoryId !== "any") {
    const category = categoryOptions.find((item) => item.value === filters.categoryId);
    if (category) chips.push(category.label);
  }
  return chips;
}
