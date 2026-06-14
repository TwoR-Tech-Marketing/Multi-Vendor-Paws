import type { Product } from "@/features/products/domain/types";
import { formatEgp } from "@/features/products/domain/currency";
import type { AppStrings } from "@/shared/i18n/types";

export type ProductExportColumnId =
  | "name"
  | "category"
  | "price"
  | "stock"
  | "status"
  | "sku";

export type ProductExportColumnDef = {
  id: ProductExportColumnId;
  label: string;
  defaultSelected: boolean;
};

export function getProductExportColumns(strings: AppStrings): ProductExportColumnDef[] {
  return [
    { id: "name", label: strings.products.tableProduct, defaultSelected: true },
    { id: "category", label: strings.products.tableCategory, defaultSelected: true },
    { id: "price", label: strings.products.tablePrice, defaultSelected: true },
    { id: "stock", label: strings.products.tableStock, defaultSelected: true },
    { id: "status", label: strings.products.tableStatus, defaultSelected: true },
    { id: "sku", label: strings.products.fields.sku, defaultSelected: false },
  ];
}

export function defaultProductExportSelection(
  strings: AppStrings,
): Record<ProductExportColumnId, boolean> {
  const selection = {} as Record<ProductExportColumnId, boolean>;
  for (const column of getProductExportColumns(strings)) {
    selection[column.id] = column.defaultSelected;
  }
  return selection;
}

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function productExportCellValue(
  product: Product,
  columnId: ProductExportColumnId,
  strings: AppStrings,
): string {
  switch (columnId) {
    case "name":
      return product.name;
    case "category":
      return product.categoryNames[0] ?? "";
    case "price":
      return formatEgp(product.pricePiastres);
    case "stock":
      return String(product.stock);
    case "status":
      return strings.products.statusLabels[product.status];
    case "sku":
      return product.sku ?? "";
    default:
      return "";
  }
}

export function buildProductsCsv(
  products: Product[],
  selected: Record<ProductExportColumnId, boolean>,
  strings: AppStrings,
): string {
  const columns = getProductExportColumns(strings).filter((column) => selected[column.id]);
  if (columns.length === 0 || products.length === 0) return "";

  const header = columns.map((column) => escapeCsvCell(column.label)).join(",");
  const rows = products.map((product) =>
    columns
      .map((column) => escapeCsvCell(productExportCellValue(product, column.id, strings)))
      .join(","),
  );

  return [header, ...rows].join("\n");
}

export function downloadProductsCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function productsExportFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `tender-paws-products-${date}.csv`;
}
