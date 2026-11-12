"use client";

import { NotificationBellButton } from "@/features/vendor/presentation/NotificationBellButton";
import { PortalBackButton } from "@/features/vendor/presentation/PortalBackButton";
import { usePortalHeaderActions } from "@/features/vendor/presentation/PortalHeaderActionsContext";
import { IconMenu } from "@/features/vendor/presentation/PortalNavIcons";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { StoreAvatarButton } from "@/features/vendor/presentation/StoreAvatarButton";
import { TestAccountBadge } from "@/features/vendor/presentation/TestAccountBadge";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

type PortalTopbarProps = {
  title: string;
  subtitle: string;
  showBack: boolean;
  onMenuOpen: () => void;
  isMenuOpen: boolean;
};

export function PortalTopbar({
  title,
  subtitle,
  showBack,
  onMenuOpen,
  isMenuOpen,
}: PortalTopbarProps) {
  const strings = useStrings();
  const { actions: headerActions } = usePortalHeaderActions();
  const { isTestAccount } = usePortalSession();

  return (
    <header className={styles.topbar}>
      <div className={styles.topbarTopRow}>
        <div className={styles.topbarTopRowLeft}>
          <button
            type="button"
            className={styles.menuBtn}
            onClick={onMenuOpen}
            aria-label={strings.portal.openMenu}
            aria-expanded={isMenuOpen}
          >
            <IconMenu />
          </button>
          <TestAccountBadge isTest={isTestAccount} />
        </div>

        <div className={styles.topbarTopRowRight}>
          <NotificationBellButton />
          <StoreAvatarButton />
        </div>
      </div>

      <div className={styles.pageHeaderCard}>
        <div className={styles.pageHeaderRow}>
          {showBack ? <PortalBackButton /> : null}
          <div className={styles.pageHeaderTitle}>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {headerActions ? (
            <div className={styles.pageHeaderActions}>{headerActions}</div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
