"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { Routes } from "@/constants/routes";
import {
  archiveVendorProductFromApi,
  fetchProductCategoriesFromApi,
  fetchVendorProductsFromApi,
  type ProductCategoryOption,
} from "@/features/products/application/products.api";
import { formatEgp } from "@/features/products/domain/currency";
import type { Product } from "@/features/products/domain/types";
import { IconEdit, IconTrash } from "@/features/products/presentation/ProductIcons";
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  type ProductListFilters,
} from "@/features/products/lib/productListFilters";
import { ProductsListActions } from "@/features/products/presentation/ProductsListActions";
import { ProductStatusBadge } from "@/features/products/presentation/ProductStatusBadge";
import { ProductsSkeleton } from "@/features/products/presentation/ProductsSkeleton";
import { IconProducts } from "@/features/vendor/presentation/PortalNavIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./products.module.css";

const LOW_STOCK_THRESHOLD = 15;

export function ProductsSection() {
  const strings = useStrings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [categoryItems, setCategoryItems] = useState<ProductCategoryOption[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProductListFilters>(EMPTY_PRODUCT_LIST_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const categoryItems = await fetchProductCategoriesFromApi();
      setCategoryItems(categoryItems);
      setCategories(
        categoryItems.map((category) => ({
          value: category.categoryId,
          label: category.name,
        })),
      );
    } catch {
      // Category filter is optional — catalog can still load.
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setError(null);
    if (products.length === 0) {
      setIsLoading(true);
    }

    try {
      const productPage = await fetchVendorProductsFromApi({
        status: filters.status === "any" ? undefined : filters.status,
        categoryId: filters.categoryId === "any" ? undefined : filters.categoryId,
        query: search.trim() || undefined,
        pageSize: 50,
      });
      setProducts(productPage.items);
    } catch {
      setError(strings.products.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [
    filters.categoryId,
    filters.status,
    products.length,
    search,
    strings.products.loadError,
  ]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const isFiltered =
    search.trim().length > 0 || filters.status !== "any" || filters.categoryId !== "any";

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setFilters(EMPTY_PRODUCT_LIST_FILTERS);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setError(null);
    setSuccess(null);

    try {
      await archiveVendorProductFromApi(deleteTarget.productId);
      setSuccess(strings.products.deleteSuccess);
      setDeleteTarget(null);
      await loadProducts();
    } catch {
      setError(strings.products.deleteError);
    } finally {
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  return (
    <section className={styles.sectionStack}>
      <ProductsListActions
        searchQuery={searchInput}
        onSearchChange={setSearchInput}
        filters={filters}
        onFilterChange={setFilters}
        categoryOptions={categories}
        categoryItems={categoryItems}
        productsToExport={products}
        onImportComplete={() => {
          void loadProducts();
          setSuccess(strings.products.importSuccess);
        }}
      />

      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>
      ) : null}

      <article className={styles.panel}>
        {products.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon} aria-hidden>
              <IconProducts width={26} height={26} />
            </div>
            <h3>
              {isFiltered
                ? strings.products.emptyFilteredTitle
                : strings.products.emptyTitle}
            </h3>
            <p>
              {isFiltered
                ? strings.products.emptyFilteredDescription
                : strings.products.emptyDescription}
            </p>
            {isFiltered ? (
              <div className={styles.emptyStateAction}>
                <button type="button" className={styles.btnSecondary} onClick={clearFilters}>
                  {strings.products.clearFilters}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{strings.products.tableProduct}</th>
                  <th>{strings.products.tableCategory}</th>
                  <th>{strings.products.tablePrice}</th>
                  <th>{strings.products.tableStock}</th>
                  <th>{strings.products.tableStatus}</th>
                  <th>{strings.products.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const isLowStock =
                    product.stock > 0 && product.stock <= LOW_STOCK_THRESHOLD;

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
                            ) : null}
                          </div>
                          <div className={styles.productMeta}>
                            <strong>{product.name}</strong>
                            {product.description ? (
                              <small>{product.description}</small>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td>{product.categoryNames[0] ?? "—"}</td>
                      <td>{formatEgp(product.pricePiastres)}</td>
                      <td>
                        <span className={isLowStock ? styles.stockLow : undefined}>
                          {isLowStock
                            ? strings.products.stockLow.replace(
                                "{count}",
                                String(product.stock),
                              )
                            : product.stock}
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
                            aria-label={strings.products.editAction}
                          >
                            <IconEdit />
                          </Link>
                          <button
                            type="button"
                            className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                            aria-label={strings.products.deleteAction}
                            onClick={() => setDeleteTarget(product)}
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

      <LogoutConfirmDialog
        open={deleteTarget !== null}
        title={strings.products.deleteTitle}
        message={strings.products.deleteMessage}
        confirmLabel={
          isDeleting ? strings.products.deleting : strings.products.deleteConfirm
        }
        cancelLabel={strings.common.cancel}
        isConfirming={isDeleting}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
      />
    </section>
  );
}
