"use client";

import { useCallback, useEffect, useState } from "react";

import {
  fetchProductCategoriesFromApi,
  updateProductCategoryStatusFromApi,
} from "@/features/products/application/products.api";
import type { ProductCategoryOption } from "@/features/products/application/products.api";
import { ProductStatusBadge } from "@/features/products/presentation/ProductStatusBadge";
import { ProductsSkeleton } from "@/features/products/presentation/ProductsSkeleton";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./products.module.css";

type CategoryRow = ProductCategoryOption & { isUpdating: boolean };

export function CategoriesSection() {
  const strings = useStrings();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadCategories = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const items = await fetchProductCategoriesFromApi({ includeInactive: true });
      setCategories(items.map((item) => ({ ...item, isUpdating: false })));
    } catch {
      setError(strings.products.categories.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [strings.products.categories.loadError]);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  async function toggleCategoryStatus(category: CategoryRow) {
    const nextActive = !category.isActive;
    setCategories((current) =>
      current.map((row) =>
        row.categoryId === category.categoryId ? { ...row, isUpdating: true } : row,
      ),
    );
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateProductCategoryStatusFromApi(
        category.categoryId,
        nextActive,
      );
      setCategories((current) =>
        current.map((row) =>
          row.categoryId === updated.categoryId
            ? { ...updated, isUpdating: false }
            : row,
        ),
      );
      setSuccess(
        nextActive
          ? strings.products.categories.activateSuccess.replace(
              "{name}",
              updated.name,
            )
          : strings.products.categories.deactivateSuccess.replace(
              "{name}",
              updated.name,
            ),
      );
    } catch {
      setError(strings.products.categories.updateError);
      setCategories((current) =>
        current.map((row) =>
          row.categoryId === category.categoryId ? { ...row, isUpdating: false } : row,
        ),
      );
    }
  }

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  return (
    <section>
      <div className={styles.formHeader}>
        <span className={styles.phaseBadge}>{strings.products.categories.badge}</span>
        <h2>{strings.products.categories.title}</h2>
        <p>{strings.products.categories.subtitle}</p>
      </div>

      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>
      ) : null}

      <article className={styles.panel}>
        {categories.length === 0 ? (
          <div className={styles.emptyState}>
            <h3>{strings.products.categories.emptyTitle}</h3>
            <p>{strings.products.categories.emptyDescription}</p>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>{strings.products.categories.tableName}</th>
                  <th>{strings.products.categories.tableStatus}</th>
                  <th>{strings.products.categories.tableActions}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.categoryId}>
                    <td>
                      <strong>{category.name}</strong>
                    </td>
                    <td>
                      <ProductStatusBadge
                        status={category.isActive ? "active" : "inactive"}
                        strings={strings}
                      />
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={
                            category.isActive ? styles.btnSecondary : styles.btnPrimary
                          }
                          disabled={category.isUpdating}
                          onClick={() => void toggleCategoryStatus(category)}
                        >
                          {category.isUpdating
                            ? strings.common.loading
                            : category.isActive
                              ? strings.products.categories.deactivate
                              : strings.products.categories.activate}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </article>
    </section>
  );
}
