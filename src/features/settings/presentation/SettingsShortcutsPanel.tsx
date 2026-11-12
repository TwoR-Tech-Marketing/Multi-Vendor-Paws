import Link from "next/link";

import { Routes } from "@/constants/routes";
import {
  isScreenVisible,
  type VendorScreenKey,
} from "@/features/vendor/domain/vendor-type-config";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsShortcutsPanelProps = {
  strings: AppStrings;
  vendorType?: string;
};

export function SettingsShortcutsPanel({ strings, vendorType }: SettingsShortcutsPanelProps) {
  const t = strings.settings;

  const shortcuts = [
    { href: Routes.vendor.coverage, label: t.coverageShortcut, screen: "coverage" },
    { href: Routes.vendor.products, label: t.shortcutsProducts, screen: "products" },
    { href: Routes.vendor.orders, label: t.shortcutsOrders, screen: "orders" },
    { href: Routes.vendor.earnings, label: t.shortcutsEarnings, screen: "earnings" },
    { href: Routes.vendor.profile, label: t.shortcutsProfile, screen: "profile" },
  ].filter((item) => isScreenVisible(vendorType, item.screen as VendorScreenKey));

  return (
    <article className={portalStyles.panel} aria-labelledby="settings-shortcuts-title">
      <h2 id="settings-shortcuts-title" className={styles.panelTitle}>
        {t.shortcutsTitle}
      </h2>

      <div className={styles.shortcutsGrid}>
        {shortcuts.map((item) => (
          <Link key={item.href} href={item.href} className={styles.shortcutCard}>
            {item.label}
          </Link>
        ))}
      </div>
    </article>
  );
}
