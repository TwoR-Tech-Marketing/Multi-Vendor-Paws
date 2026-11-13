import Image from "next/image";
import Link from "next/link";

import { EmptyState } from "@/components/ui/empty-state/EmptyState";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import type { LoadErrorView } from "@/components/ui/error-state/load-error";
import { Routes } from "@/constants/routes";
import { formatEgp } from "@/features/products/domain/currency";
import type { Product } from "@/features/products/domain/types";
import { IconEdit, IconImage, IconTrash } from "@/features/products/presentation/ProductIcons";
import { ProductStatusBadge } from "@/features/products/presentation/ProductStatusBadge";
import type { AppStrings } from "@/shared/i18n/types";
import type { AppLocale } from "@/shared/preferences/domain/types";

import styles from "./products.module.css";

const LOW_STOCK_THRESHOLD = 15;

type ProductsListPanelProps = {
  products: Product[];
  loadError: LoadErrorView | null;
  isFiltered: boolean;
  strings: AppStrings;
  locale: AppLocale;
  onRetry: () => void;
  onClearFilters: () => void;
  onDelete: (product: Product) => void;
};

/**
 * Catalog body: error (full, or compact above kept rows), empty with the add
 * action, filtered empty or the table. Arabic shows the Arabic name when set.
 */
export function ProductsListPanel({
  products,
  loadError,
  isFiltered,
  strings,
  locale,
  onRetry,
  onClearFilters,
  onDelete,
}: ProductsListPanelProps) {
  return (
    <>
        {loadError && products.length > 0 ? (
          <LoadErrorState
            view={loadError}
            strings={strings}
            onRetry={onRetry}
            compact
          />
        ) : null}

        <article className={styles.panel}>
          {loadError && products.length === 0 ? (
            <LoadErrorState
              view={loadError}
              strings={strings}
              onRetry={onRetry}
            />
          ) : products.length === 0 ? (
            <EmptyState
              headingLevel={2}
              title={
                isFiltered ? strings.products.emptyFilteredTitle : strings.products.emptyTitle
              }
              description={
                isFiltered
                  ? strings.products.emptyFilteredDescription
                  : strings.products.emptyDescription
              }
              action={
                isFiltered ? (
                  <button type="button" className={styles.btnSecondary} onClick={onClearFilters}>
                    {strings.products.clearFilters}
                  </button>
                ) : (
                  <Link href={Routes.vendor.productNew} className={styles.btnSecondary}>
                    {strings.products.addProduct}
                  </Link>
                )
              }
            />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th>{strings.products.tableProduct}</th>
                    <th>{strings.products.tableCategory}</th>
                    <th className={styles.money}>{strings.products.tablePrice}</th>
                    <th className={styles.money}>{strings.products.tableStock}</th>
                    <th>{strings.products.tableStatus}</th>
                    <th className={styles.actionsHead}>{strings.products.tableActions}</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => {
                    const isLowStock =
                      product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;
                    const displayName =
                      locale === "ar" && product.nameAr ? product.nameAr : product.name;
                    const displayDescription =
                      locale === "ar" && product.descriptionAr
                        ? product.descriptionAr
                        : product.description;
                    const discounted = product.priceAfterDiscountPiastres ?? null;
                    const hasDiscount = discounted !== null && discounted < product.pricePiastres;

                    return (
                      <tr key={product.productId}>
                        <td>
                          <div className={styles.productCell}>
                            <div className={styles.thumb}>
                              {product.primaryImageUrl ? (
                                <Image
                                  src={product.primaryImageUrl}
                                  alt=""
                                  width={48}
                                  height={48}
                                  unoptimized
                                />
                              ) : (
                                <IconImage />
                              )}
                            </div>
                            <div className={styles.productMeta}>
                              <strong title={displayName}>{displayName}</strong>
                              {displayDescription ? (
                                <small title={displayDescription}>{displayDescription}</small>
                              ) : null}
                            </div>
                          </div>
                        </td>
                        <td className={product.categoryNames[0] ? undefined : styles.mutedCell}>
                          {product.categoryNames[0] ?? strings.states.notProvided}
                        </td>
                        <td className={styles.money}>
                          {hasDiscount ? (
                            <span className={styles.priceStack}>
                              <span>{formatEgp(discounted, locale)}</span>
                              <s className={styles.priceWas}>{formatEgp(product.pricePiastres, locale)}</s>
                            </span>
                          ) : (
                            formatEgp(product.pricePiastres, locale)
                          )}
                        </td>
                        <td className={styles.money}>
                          <span
                            className={
                              product.stock === 0
                                ? styles.stockOut
                                : isLowStock
                                  ? styles.stockLow
                                  : undefined
                            }
                          >
                            {isLowStock
                              ? strings.products.stockLow.replace(
                                  "{count}",
                                  String(product.stock),
                                )
                              : product.stock.toLocaleString("en-US")}
                          </span>
                        </td>
                        <td>
                          <ProductStatusBadge status={product.status} strings={strings} />
                        </td>
                        <td>
                          <div className={styles.actions}>
                            <Link
                              href={Routes.vendor.productEdit(product.productId)}
                              className={styles.iconBtn}
                              aria-label={`${strings.products.editAction}: ${displayName}`}
                            >
                              <IconEdit />
                            </Link>
                            <button
                              type="button"
                              className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                              aria-label={`${strings.products.deleteAction}: ${displayName}`}
                              onClick={() => onDelete(product)}
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
    </>
  );
}
