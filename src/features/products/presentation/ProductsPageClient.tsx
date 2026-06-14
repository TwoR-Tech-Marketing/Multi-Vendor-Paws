"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { Routes } from "@/constants/routes";
import { CategoriesSection } from "@/features/products/presentation/CategoriesSection";
import { IconAddCircle } from "@/features/products/presentation/ProductIcons";
import { ProductsSection } from "@/features/products/presentation/ProductsSection";
import { usePortalHeaderActions } from "@/features/vendor/presentation/PortalHeaderActionsContext";
import portalStyles from "@/features/vendor/presentation/portal.module.css";
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
  const { setActions } = usePortalHeaderActions();
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

  useEffect(() => {
    if (activeTab !== "catalog") {
      setActions(null);
      return;
    }

    setActions(
      <Link href={Routes.vendor.productNew} className={portalStyles.headerPrimaryBtn}>
        <IconAddCircle width={20} height={20} />
        {strings.products.addProduct}
      </Link>,
    );

    return () => setActions(null);
  }, [activeTab, setActions, strings.products.addProduct]);

  return (
    <div className={styles.page}>
      <div className={styles.tabsBar} role="tablist" aria-label={strings.products.tabsLabel}>
        <div className={styles.tabsHeader}>
          <div className={styles.tabsList}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "catalog"}
              className={styles.tabItem}
              onClick={() => setTab("catalog")}
            >
              <span
                className={
                  activeTab === "catalog" ? styles.tabTextActive : styles.tabTextInactive
                }
              >
                {strings.products.tabs.catalog}
              </span>
              <span
                className={
                  activeTab === "catalog"
                    ? styles.tabIndicatorActive
                    : styles.tabIndicatorInactive
                }
                aria-hidden
              />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "categories"}
              className={styles.tabItem}
              onClick={() => setTab("categories")}
            >
              <span
                className={
                  activeTab === "categories" ? styles.tabTextActive : styles.tabTextInactive
                }
              >
                {strings.products.tabs.categories}
              </span>
              <span
                className={
                  activeTab === "categories"
                    ? styles.tabIndicatorActive
                    : styles.tabIndicatorInactive
                }
                aria-hidden
              />
            </button>
          </div>
        </div>
        <div className={styles.tabsDivider} aria-hidden />
      </div>

      {activeTab === "catalog" ? <ProductsSection /> : <CategoriesSection />}
    </div>
  );
}
