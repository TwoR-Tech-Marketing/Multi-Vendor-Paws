"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

import { CategoriesSection } from "@/features/products/presentation/CategoriesSection";
import { ProductsSection } from "@/features/products/presentation/ProductsSection";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./products.module.css";

type ProductsTab = "catalog" | "categories";

function resolveTab(value: string | null): ProductsTab {
  return value === "categories" ? "categories" : "catalog";
}

export function ProductsPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const strings = useStrings();
  const activeTab = resolveTab(searchParams.get("tab"));

  const setTab = useCallback(
    (tab: ProductsTab) => {
      const params = new URLSearchParams(searchParams.toString());
      if (tab === "catalog") {
        params.delete("tab");
      } else {
        params.set("tab", tab);
      }
      const query = params.toString();
      router.replace(query ? `/products?${query}` : "/products");
    },
    [router, searchParams],
  );

  return (
    <div>
      <div className={styles.tabBar} role="tablist" aria-label={strings.products.tabsLabel}>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "catalog"}
          className={`${styles.tab} ${activeTab === "catalog" ? styles.tabActive : ""}`}
          onClick={() => setTab("catalog")}
        >
          {strings.products.tabs.catalog}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "categories"}
          className={`${styles.tab} ${activeTab === "categories" ? styles.tabActive : ""}`}
          onClick={() => setTab("categories")}
        >
          {strings.products.tabs.categories}
        </button>
      </div>

      {activeTab === "catalog" ? <ProductsSection /> : <CategoriesSection />}
    </div>
  );
}
