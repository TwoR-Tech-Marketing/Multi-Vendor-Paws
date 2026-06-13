"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemedSvgIcon } from "@/components/ui/themed-icon/ThemedIcon";
import { Routes } from "@/constants/routes";
import { uiAssets } from "@/shared/assets/ui-assets";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

export function NotificationBellButton() {
  const strings = useStrings();
  const pathname = usePathname();
  const isNotificationsActive = pathname.startsWith(Routes.vendor.notifications);

  return (
    <div className={styles.bellWrap}>
      <Link
        href={Routes.vendor.notifications}
        prefetch
        scroll={false}
        className={`${styles.bellBtn} ${isNotificationsActive ? styles.bellBtnActive : ""}`}
        aria-label={strings.notifications.open}
        aria-current={isNotificationsActive ? "page" : undefined}
      >
        <span className={styles.bellIcon} aria-hidden>
          <ThemedSvgIcon src={uiAssets.bellRead} tone="muted" width={22} height={29} />
        </span>
      </Link>
    </div>
  );
}
