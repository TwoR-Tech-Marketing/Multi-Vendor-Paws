import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { Product } from "@/features/products/domain/types";
import { ProductsListPanel } from "@/features/products/presentation/ProductsListPanel";
import { getStrings } from "@/shared/i18n/get-strings";

const en = getStrings("en");
const ar = getStrings("ar");
const esc = (text: string) => text.replace(/'/g, "&#x27;");
const noop = () => {};

const PRODUCT = {
  productId: "p1",
  vendorId: "v1",
  vendorStoreName: "Paws Corner",
  name: "Royal Canin Adult 4 kg",
  nameAr: "رويال كانين 4 كجم",
  description: null,
  descriptionAr: null,
  slug: null,
  imageUrls: [],
  primaryImageUrl: "",
  categoryIds: [],
  primaryCategoryId: "",
  categoryNames: [],
  pricePiastres: 145000,
  priceAfterDiscountPiastres: 120000,
  currency: "EGP",
  stock: 3,
  lowStockThreshold: null,
  sku: null,
  status: "active",
  isHalo: false,
  tags: [],
  createdBy: "",
  updatedBy: "",
  createdAt: new Date(0),
  updatedAt: new Date(0),
} as unknown as Product;

function render(props: Partial<Parameters<typeof ProductsListPanel>[0]> = {}) {
  return renderToStaticMarkup(
    <ProductsListPanel
      products={[]}
      loadError={null}
      isFiltered={false}
      strings={en}
      locale="en"
      onRetry={noop}
      onClearFilters={noop}
      onDelete={noop}
      {...props}
    />,
  );
}

describe("ProductsListPanel", () => {
  it("shows the empty state with the add product action", () => {
    const html = render();
    expect(html).toContain(en.products.emptyTitle);
    expect(html).toContain('href="/products/new"');
    expect(html).toContain(en.products.addProduct);
  });

  it("offers clear filters when a filter hides every product", () => {
    const html = render({ isFiltered: true });
    expect(html).toContain(en.products.emptyFilteredTitle);
    expect(html).toContain(en.products.clearFilters);
    expect(html).not.toContain('href="/products/new"');
  });

  it("shows a friendly error with retry and no empty state", () => {
    const html = render({
      loadError: { kind: "error", title: en.states.errorTitle, description: en.products.loadError },
    });
    expect(html).toContain('role="alert"');
    expect(html).toContain(esc(en.products.loadError));
    expect(html).not.toContain(en.products.emptyTitle);
  });

  it("end aligns price and stock, shows the discount, a placeholder and named actions", () => {
    const html = render({ products: [PRODUCT] });
    expect(html).toContain("1,200.00 EGP");
    expect(html).toContain("1,450.00 EGP</s>");
    expect(html).toContain(en.products.stockLow.replace("{count}", "3"));
    expect(html).toContain(`aria-label="${en.products.editAction}: ${PRODUCT.name}"`);
    expect(html).toContain(en.states.notProvided);
    expect(html).toContain("<svg");
  });

  it("shows the Arabic name and Arabic money in Arabic", () => {
    const html = render({ products: [PRODUCT], strings: ar, locale: "ar" });
    expect(html).toContain(PRODUCT.nameAr as string);
    expect(html).toContain("⁦1,200.00⁩ ج.م");
  });
});
