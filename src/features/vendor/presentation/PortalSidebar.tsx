"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemedImage, ThemedSvgIcon } from "@/components/ui/themed-icon/ThemedIcon";
import { portalNavAssets } from "@/features/vendor/presentation/portal-assets";
import { getPortalSidebarNavItems } from "@/features/vendor/presentation/portal-nav";
import { usePortalSignOut } from "@/features/vendor/presentation/PortalSignOutContext";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { IconClose } from "@/features/vendor/presentation/PortalNavIcons";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./sidebar.module.css";

type PortalSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PortalSidebar({ isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname();
  const strings = useStrings();
  const { isActiveVendor, isLoggingOut, profile } = usePortalSession();
  const navItems = getPortalSidebarNavItems(strings, profile.vendorType);
  const { requestSignOut } = usePortalSignOut();

  function onSignOutClick() {
    onClose();
    requestSignOut();
  }

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      aria-label={strings.portal.navigationLabel}
    >
      <div className={styles.sidebarBg} aria-hidden />

      <div className={styles.sidebarInner}>
        <button
          type="button"
          className={styles.drawerClose}
          onClick={onClose}
          aria-label={strings.portal.closeMenu}
        >
          <IconClose />
        </button>

        <div className={styles.logo}>
          <ThemedImage
            src={portalNavAssets.logo}
            alt={strings.portal.brandName}
            width={46}
            height={46}
            className={styles.logoImage}
          />
        </div>

        <nav className={styles.navScroll}>
          {navItems.map((item, index) => {
            const isActive =
              item.href !== null &&
              (pathname === item.href || pathname.startsWith(`${item.href}/`));
            const isLocked =
              item.comingSoon || (item.requiresActiveAccount && !isActiveVendor);
            const isLast = index === navItems.length - 1;
            const iconTone = isActive ? "accent" : "default";

            const itemClassName = [
              styles.navItem,
              isActive ? styles.navItemActive : "",
              isLocked ? styles.navItemLocked : "",
            ]
              .filter(Boolean)
              .join(" ");

            const itemContent = (
              <>
                <ThemedSvgIcon
                  src={item.icon}
                  className={styles.navIcon}
                  tone={iconTone}
                  width={22}
                  height={22}
                />
                <span className={styles.navLabel}>{item.label}</span>
                {item.comingSoon ? (
                  <span className={styles.navBadge}>{strings.nav.comingSoon}</span>
                ) : null}
              </>
            );

            return (
              <div key={item.id} className={styles.navGroup}>
                {isLocked || item.href === null ? (
                  <span
                    className={itemClassName}
                    title={item.comingSoon ? strings.nav.comingSoon : strings.nav.lockedHint}
                    aria-disabled="true"
                  >
                    {itemContent}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    prefetch
                    scroll={false}
                    className={itemClassName}
                    onClick={onClose}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {itemContent}
                  </Link>
                )}

                {!isLast ? <span className={styles.navRule} aria-hidden /> : null}
              </div>
            );
          })}
        </nav>

        <button
          type="button"
          className={styles.logout}
          onClick={onSignOutClick}
          disabled={isLoggingOut}
        >
          <ThemedSvgIcon
            src={portalNavAssets.logout}
            className={styles.logoutIcon}
            tone="logout"
            width={18}
            height={18}
          />
          <span>
            {isLoggingOut ? strings.common.signingOut : strings.nav.logOut}
          </span>
        </button>
      </div>
    </aside>
  );
}
