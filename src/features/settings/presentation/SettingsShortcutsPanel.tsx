import Link from "next/link";

import { Routes } from "@/constants/routes";
import type { AppStrings } from "@/shared/i18n/types";

import portalStyles from "@/features/vendor/presentation/portal.module.css";
import styles from "./settings.module.css";

type SettingsShortcutsPanelProps = {
  strings: AppStrings;
};

export function SettingsShortcutsPanel({ strings }: SettingsShortcutsPanelProps) {
  const t = strings.settings;

  const shortcuts = [
    { href: Routes.vendor.products, label: t.shortcutsProducts },
    { href: Routes.vendor.orders, label: t.shortcutsOrders },
    { href: Routes.vendor.earnings, label: t.shortcutsEarnings },
    { href: Routes.vendor.profile, label: t.shortcutsProfile },
  ] as const;

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
