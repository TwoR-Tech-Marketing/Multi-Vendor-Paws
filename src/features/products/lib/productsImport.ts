import * as XLSX from "xlsx";

import type { ProductCategoryOption } from "@/features/products/application/products.api";
import { egpToPiastres } from "@/features/products/domain/currency";
import {
  PRODUCT_IMPORT_MAX_ROWS,
  PRODUCT_IMPORT_PLACEHOLDER_PATH,
} from "@/features/products/domain/import.constants";
import type { CreateProductPayload } from "@/features/products/domain/schemas";
import type { ProductStatus } from "@/features/products/domain/types";
import type { AppStrings } from "@/shared/i18n/types";

export type ProductImportParseResult = {
  rows: ParsedImportRow[];
  fileError?: string;
};

export type ParsedImportRow = {
  /** 1-based Excel row number (header is row 1). */
  rowNumber: number;
  name: string;
  payload: CreateProductPayload | null;
  errors: string[];
  warnings: string[];
};

type CategoryLookup = {
  byId: Map<string, ProductCategoryOption>;
  byName: Map<string, ProductCategoryOption>;
};

const HEADER_ALIASES: Record<string, string> = {
  name: "name",
  product_name: "name",
  product: "name",
  productname: "name",
  name_ar: "name_ar",
  namear: "name_ar",
  arabic_name: "name_ar",
  description: "description",
  desc: "description",
  description_ar: "description_ar",
  descriptionar: "description_ar",
  category: "category",
  category_name: "category",
  category_id: "category_id",
  categoryid: "category_id",
  price: "price_egp",
  price_egp: "price_egp",
  priceegp: "price_egp",
  sale_price: "sale_price_egp",
  sale_price_egp: "sale_price_egp",
  saleprice: "sale_price_egp",
  salepriceegp: "sale_price_egp",
  stock: "stock",
  quantity: "stock",
  qty: "stock",
  sku: "sku",
  status: "status",
  image_url: "image_urls",
  image_urls: "image_urls",
  imageurls: "image_urls",
  images: "image_urls",
  tags: "tags",
};

function normalizeHeader(value: unknown): string {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\*/g, "")
    .replace(/\([^)]*\)/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  return HEADER_ALIASES[raw] ?? raw;
}

function cellToString(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return String(value).trim();
}

function parseNumber(value: unknown): number | null {
  const raw = cellToString(value).replace(/,/g, "");
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function splitList(value: unknown): string[] {
  const raw = cellToString(value);
  if (!raw) return [];
  return raw
    .split(/[,;|]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseStatus(value: unknown): ProductStatus | null {
  const raw = cellToString(value).toLowerCase().replace(/\s+/g, "_");
  if (!raw) return null;

  if (raw === "active" || raw === "inactive" || raw === "out_of_stock") {
    return raw;
  }

  return null;
}

function buildCategoryLookup(categories: ProductCategoryOption[]): CategoryLookup {
  const active = categories.filter((category) => category.isActive);
  const byId = new Map<string, ProductCategoryOption>();
  const byName = new Map<string, ProductCategoryOption>();

  for (const category of active) {
    byId.set(category.categoryId, category);
    byName.set(category.name.trim().toLowerCase(), category);
    if (category.nameAr?.trim()) {
      byName.set(category.nameAr.trim().toLowerCase(), category);
    }
  }

  return { byId, byName };
}

function resolveCategory(
  row: Record<string, unknown>,
  lookup: CategoryLookup,
  strings: AppStrings,
): { categoryId: string | null; error?: string } {
  const categoryIdRaw = cellToString(row.category_id);
  if (categoryIdRaw) {
    const match = lookup.byId.get(categoryIdRaw);
    if (!match) {
      return { categoryId: null, error: strings.products.import.errors.categoryNotFound };
    }
    return { categoryId: match.categoryId };
  }

  const categoryName = cellToString(row.category);
  if (!categoryName) {
    return { categoryId: null, error: strings.products.import.errors.categoryRequired };
  }

  const match = lookup.byName.get(categoryName.toLowerCase());
  if (!match) {
    return { categoryId: null, error: strings.products.import.errors.categoryNotFound };
  }

  return { categoryId: match.categoryId };
}

function resolveImageUrls(
  row: Record<string, unknown>,
  placeholderImageUrl: string,
  strings: AppStrings,
): { imageUrls: string[]; warnings: string[] } {
  const warnings: string[] = [];
  const urls = splitList(row.image_urls).filter((url) => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
      return false;
    }
  });

  if (urls.length === 0) {
    warnings.push(strings.products.import.warnings.placeholderImage);
    return { imageUrls: [placeholderImageUrl], warnings };
  }

  return { imageUrls: urls.slice(0, 8), warnings };
}

function rowToPayload(
  row: Record<string, unknown>,
  lookup: CategoryLookup,
  placeholderImageUrl: string,
  strings: AppStrings,
): { payload: CreateProductPayload | null; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const name = cellToString(row.name);
  if (name.length < 2) {
    errors.push(strings.products.import.errors.nameRequired);
  }

  const nameAr = cellToString(row.name_ar);
  const description = cellToString(row.description);
  const descriptionAr = cellToString(row.description_ar);

  const { categoryId, error: categoryError } = resolveCategory(row, lookup, strings);
  if (categoryError) errors.push(categoryError);

  const priceEgp = parseNumber(row.price_egp);
  if (priceEgp == null || priceEgp < 0) {
    errors.push(strings.products.import.errors.priceInvalid);
  }

  const salePriceEgp = parseNumber(row.sale_price_egp);
  if (cellToString(row.sale_price_egp) && (salePriceEgp == null || salePriceEgp < 0)) {
    errors.push(strings.products.import.errors.salePriceInvalid);
  }
  if (priceEgp != null && salePriceEgp != null && salePriceEgp >= priceEgp) {
    errors.push(strings.products.import.errors.salePriceTooHigh);
  }

  const stockRaw = parseNumber(row.stock);
  if (stockRaw == null || !Number.isInteger(stockRaw) || stockRaw < 0) {
    errors.push(strings.products.import.errors.stockInvalid);
  }
  const stock = stockRaw ?? 0;

  const statusParsed = parseStatus(row.status);
  if (cellToString(row.status) && !statusParsed) {
    errors.push(strings.products.import.errors.statusInvalid);
  }

  let status: ProductStatus = statusParsed ?? "active";
  if (stock === 0 && status === "active") {
    status = "out_of_stock";
  }

  const sku = cellToString(row.sku) || null;
  const tags = splitList(row.tags).slice(0, 20);

  const { imageUrls, warnings: imageWarnings } = resolveImageUrls(
    row,
    placeholderImageUrl,
    strings,
  );
  warnings.push(...imageWarnings);

  if (errors.length > 0 || !categoryId || priceEgp == null) {
    return { payload: null, errors, warnings };
  }

  let pricePiastres: number;
  let priceAfterDiscountPiastres: number | null = null;

  try {
    pricePiastres = egpToPiastres(priceEgp);
    if (salePriceEgp != null) {
      priceAfterDiscountPiastres = egpToPiastres(salePriceEgp);
    }
  } catch {
    errors.push(strings.products.import.errors.priceInvalid);
    return { payload: null, errors, warnings };
  }

  return {
    payload: {
      name,
      nameAr: nameAr.length >= 2 ? nameAr : null,
      description: description || null,
      descriptionAr: descriptionAr || null,
      imageUrls,
      primaryImageUrl: imageUrls[0],
      categoryIds: [categoryId],
      primaryCategoryId: categoryId,
      pricePiastres,
      priceAfterDiscountPiastres,
      stock,
      sku,
      status,
      tags: tags.length > 0 ? tags : undefined,
    },
    errors,
    warnings,
  };
}

function isRowEmpty(values: unknown[]): boolean {
  return values.every((value) => cellToString(value) === "");
}

export function parseProductsExcel(
  buffer: ArrayBuffer,
  categories: ProductCategoryOption[],
  placeholderImageUrl: string,
  strings: AppStrings,
): ProductImportParseResult {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return { rows: [], fileError: strings.products.import.errors.fileUnreadable };
  }

  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "products") ??
    workbook.SheetNames[0];

  if (!sheetName) {
    return { rows: [], fileError: strings.products.import.errors.emptyWorkbook };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  }) as unknown[][];

  if (matrix.length < 2) {
    return { rows: [], fileError: strings.products.import.errors.noDataRows };
  }

  const headerRow = matrix[0] ?? [];
  const fieldKeys = headerRow.map((cell) => normalizeHeader(cell));

  if (!fieldKeys.includes("name")) {
    return { rows: [], fileError: strings.products.import.errors.missingNameColumn };
  }

  const lookup = buildCategoryLookup(categories);
  const rows: ParsedImportRow[] = [];

  for (let index = 1; index < matrix.length; index += 1) {
    const values = matrix[index] ?? [];
    if (isRowEmpty(values)) continue;

    const record: Record<string, unknown> = {};
    for (let column = 0; column < fieldKeys.length; column += 1) {
      const key = fieldKeys[column];
      if (!key) continue;
      record[key] = values[column];
    }

    const { payload, errors, warnings } = rowToPayload(
      record,
      lookup,
      placeholderImageUrl,
      strings,
    );

    rows.push({
      rowNumber: index + 1,
      name: cellToString(record.name) || strings.products.import.unnamedRow,
      payload,
      errors,
      warnings,
    });

    if (rows.length > PRODUCT_IMPORT_MAX_ROWS) {
      return {
        rows: rows.slice(0, PRODUCT_IMPORT_MAX_ROWS),
        fileError: strings.products.import.errors.tooManyRows.replace(
          "{max}",
          String(PRODUCT_IMPORT_MAX_ROWS),
        ),
      };
    }
  }

  if (rows.length === 0) {
    return { rows: [], fileError: strings.products.import.errors.noDataRows };
  }

  return { rows };
}

export function getValidImportPayloads(rows: ParsedImportRow[]): CreateProductPayload[] {
  return rows
    .map((row) => row.payload)
    .filter((payload): payload is CreateProductPayload => payload !== null);
}

export function downloadProductsImportTemplate(
  categories: ProductCategoryOption[],
  strings: AppStrings,
): void {
  const headers = [
    strings.products.import.templateColumns.name,
    strings.products.import.templateColumns.nameAr,
    strings.products.import.templateColumns.description,
    strings.products.import.templateColumns.descriptionAr,
    strings.products.import.templateColumns.category,
    strings.products.import.templateColumns.priceEgp,
    strings.products.import.templateColumns.salePriceEgp,
    strings.products.import.templateColumns.stock,
    strings.products.import.templateColumns.sku,
    strings.products.import.templateColumns.status,
    strings.products.import.templateColumns.imageUrls,
    strings.products.import.templateColumns.tags,
  ];

  const exampleCategory =
    categories.find((category) => category.isActive)?.name ??
    strings.products.import.templateExample.category;

  const productsSheet = XLSX.utils.aoa_to_sheet([
    headers,
    [
      strings.products.import.templateExample.name,
      "",
      strings.products.import.templateExample.description,
      "",
      exampleCategory,
      strings.products.import.templateExample.price,
      "",
      strings.products.import.templateExample.stock,
      "",
      strings.products.import.templateExample.status,
      "",
      strings.products.import.templateExample.tags,
    ],
  ]);

  const categoriesSheet = XLSX.utils.aoa_to_sheet([
    [
      strings.products.import.categoriesSheet.id,
      strings.products.import.categoriesSheet.name,
      strings.products.import.categoriesSheet.nameAr,
      strings.products.import.categoriesSheet.active,
    ],
    ...categories.map((category) => [
      category.categoryId,
      category.name,
      category.nameAr ?? "",
      category.isActive
        ? strings.products.import.categoriesSheet.yes
        : strings.products.import.categoriesSheet.no,
    ]),
  ]);

  const instructionsSheet = XLSX.utils.aoa_to_sheet(
    strings.products.import.instructions.map((line) => [line]),
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, productsSheet, "Products");
  XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, "Instructions");

  const buffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = productsImportTemplateFilename();
  link.click();
  URL.revokeObjectURL(url);
}

export function productsImportTemplateFilename(): string {
  const date = new Date().toISOString().slice(0, 10);
  return `tender-paws-product-import-template-${date}.xlsx`;
}

export function getImportPlaceholderUrl(): string {
  if (typeof window === "undefined") {
    return PRODUCT_IMPORT_PLACEHOLDER_PATH;
  }
  return new URL(PRODUCT_IMPORT_PLACEHOLDER_PATH, window.location.origin).href;
}
