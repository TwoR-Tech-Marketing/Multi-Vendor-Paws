"use client";

import { Strings } from "@/constants/strings";
import { NotificationBellButton } from "@/features/vendor/presentation/NotificationBellButton";
import { IconMenu } from "@/features/vendor/presentation/PortalNavIcons";
import { StoreAvatarButton } from "@/features/vendor/presentation/StoreAvatarButton";

import styles from "./portal.module.css";

type PortalTopbarProps = {
  title: string;
  subtitle: string;
  onMenuOpen: () => void;
  isMenuOpen: boolean;
};

export function PortalTopbar({
  title,
  subtitle,
  onMenuOpen,
  isMenuOpen,
}: PortalTopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.topbarTopRow}>
        <div className={styles.topbarTopRowLeft}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onMenuOpen}
            aria-label={Strings.portal.openMenu}
            aria-expanded={isMenuOpen}
          >
            <IconMenu />
          </button>
        </div>

        <div className={styles.topbarTopRowRight}>
          <NotificationBellButton />
          <StoreAvatarButton />
        </div>
      </div>

      <div className={styles.pageHeaderCard}>
        <div className={styles.pageHeaderTitle}>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
    </header>
  );
}
