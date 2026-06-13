"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
  const navItems = getPortalSidebarNavItems(strings);
  const { isActiveVendor, isLoggingOut } = usePortalSession();
  const { requestSignOut } = usePortalSignOut();

  function onSignOutClick() {
    onClose();
    requestSignOut();
  }

  return (
    <aside
      className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ""}`}
      aria-label="Portal navigation"
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
          <Image
            src={portalNavAssets.logo}
            alt={strings.portal.brandName}
            width={46}
            height={46}
            className={styles.logoImage}
            priority
          />
        </div>

        <nav className={styles.navScroll}>
          {navItems.map((item, index) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const isLocked = item.requiresActiveAccount && !isActiveVendor;
            const isLast = index === navItems.length - 1;

            const itemClassName = [
              styles.navItem,
              isActive ? styles.navItemActive : "",
              isLocked ? styles.navItemLocked : "",
            ]
              .filter(Boolean)
              .join(" ");

            const itemContent = (
              <>
                <img
                  className={styles.navIcon}
                  src={item.icon}
                  alt=""
                  width={22}
                  height={22}
                  decoding="async"
                />
                <span className={styles.navLabel}>{item.label}</span>
              </>
            );

            return (
              <div key={item.id} className={styles.navGroup}>
                {isLocked ? (
                  <span
                    className={itemClassName}
                    title={strings.nav.lockedHint}
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

                {!isLast ? (
                  <span className={styles.navRule} aria-hidden>
                    <img
                      className={styles.navRuleImage}
                      src={portalNavAssets.navSeparator}
                      alt=""
                      decoding="async"
                    />
                  </span>
                ) : null}
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
          <span className={styles.logoutIcon} aria-hidden />
          <span>
            {isLoggingOut ? strings.common.signingOut : strings.nav.logOut}
          </span>
        </button>
      </div>
    </aside>
  );
}
