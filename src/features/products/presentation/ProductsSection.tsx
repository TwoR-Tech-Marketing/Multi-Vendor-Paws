"use client";

import { useCallback, useEffect, useState } from "react";

import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import {
  archiveVendorProductFromApi,
  fetchProductCategoriesFromApi,
  fetchVendorProductsFromApi,
  type ProductCategoryOption,
} from "@/features/products/application/products.api";
import type { Product } from "@/features/products/domain/types";
import {
  EMPTY_PRODUCT_LIST_FILTERS,
  type ProductListFilters,
} from "@/features/products/lib/productListFilters";
import { ProductsListPanel } from "@/features/products/presentation/ProductsListPanel";
import { ProductsListActions } from "@/features/products/presentation/ProductsListActions";
import { ProductsSkeleton } from "@/features/products/presentation/ProductsSkeleton";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./products.module.css";

export function ProductsSection() {
  const strings = useStrings();
  const { locale } = usePreferences();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [categoryItems, setCategoryItems] = useState<ProductCategoryOption[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<ProductListFilters>(EMPTY_PRODUCT_LIST_FILTERS);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
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
      // Category filter is optional; the catalog can still load.
    }
  }, []);

  const loadProducts = useCallback(async () => {
    setLoadError(null);
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
    } catch (failure) {
      setLoadError(toLoadErrorView(failure, strings, strings.products.loadError));
    } finally {
      setIsLoading(false);
    }
  }, [filters.categoryId, filters.status, products.length, search, strings]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCategories();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadCategories]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadProducts();
    }, 0);
    return () => window.clearTimeout(timer);
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

      {error ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          {success}
        </div>
      ) : null}
      <ProductsListPanel
        products={products}
        loadError={loadError}
        isFiltered={isFiltered}
        strings={strings}
        locale={locale}
        onRetry={() => void loadProducts()}
        onClearFilters={clearFilters}
        onDelete={setDeleteTarget}
      />

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
