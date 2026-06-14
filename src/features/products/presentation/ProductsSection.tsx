"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { Routes } from "@/constants/routes";
import {
  archiveVendorProductFromApi,
  fetchProductCategoriesFromApi,
  fetchVendorProductsFromApi,
} from "@/features/products/application/products.api";
import { formatEgp } from "@/features/products/domain/currency";
import type { Product, ProductStatus } from "@/features/products/domain/types";
import { IconEdit, IconPlus, IconSearch, IconTrash } from "@/features/products/presentation/ProductIcons";
import { ProductStatusBadge } from "@/features/products/presentation/ProductStatusBadge";
import { ProductsSkeleton } from "@/features/products/presentation/ProductsSkeleton";
import { IconProducts } from "@/features/vendor/presentation/PortalNavIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./products.module.css";

const LOW_STOCK_THRESHOLD = 15;

type StatusFilter = ProductStatus | "any";

export function ProductsSection() {
  const strings = useStrings();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("any");
  const [categoryFilter, setCategoryFilter] = useState("any");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      const categoryItems = await fetchProductCategoriesFromApi();
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
        status: statusFilter === "any" ? undefined : statusFilter,
        categoryId: categoryFilter === "any" ? undefined : categoryFilter,
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
    categoryFilter,
    products.length,
    search,
    statusFilter,
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

  const statusOptions = useMemo(
    () => [
      { value: "any", label: strings.products.filterAllStatuses },
      { value: "active", label: strings.products.statusLabels.active },
      { value: "inactive", label: strings.products.statusLabels.inactive },
      { value: "out_of_stock", label: strings.products.statusLabels.out_of_stock },
    ],
    [strings.products],
  );

  const categoryOptions = useMemo(
    () => [
      { value: "any", label: strings.products.filterAllCategories },
      ...categories,
    ],
    [categories, strings.products.filterAllCategories],
  );

  const isFiltered =
    search.trim().length > 0 || statusFilter !== "any" || categoryFilter !== "any";

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setStatusFilter("any");
    setCategoryFilter("any");
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
      <div className={styles.commandBar}>
        <div className={styles.commandBarFilters}>
          <PortalSelect
            className={styles.filterSelect}
            value={statusFilter}
            options={statusOptions}
            onChange={(value) => setStatusFilter(value as StatusFilter)}
            ariaLabel={strings.products.filterStatus}
          />
          <PortalSelect
            className={styles.filterSelect}
            value={categoryFilter}
            options={categoryOptions}
            onChange={setCategoryFilter}
            ariaLabel={strings.products.filterCategory}
          />
        </div>

        <div className={styles.commandBarActions}>
          <label className={styles.searchBox}>
            <IconSearch />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={strings.products.searchPlaceholder}
              aria-label={strings.products.searchPlaceholder}
            />
          </label>
          <Link href={Routes.vendor.productNew} className={styles.btnPrimary}>
            <IconPlus />
            {strings.products.addProduct}
          </Link>
        </div>
      </div>

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
