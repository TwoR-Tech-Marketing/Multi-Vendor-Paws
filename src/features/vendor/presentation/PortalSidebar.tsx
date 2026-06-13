"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Routes } from "@/constants/routes";
import { Strings } from "@/constants/strings";
import { PORTAL_SIDEBAR_NAV_ITEMS } from "@/features/vendor/presentation/portal-nav";
import { usePortalSignOut } from "@/features/vendor/presentation/PortalSignOutContext";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import {
  IconClose,
  IconLogout,
  IconStorefront,
} from "@/features/vendor/presentation/PortalNavIcons";

import styles from "./portal.module.css";

type PortalSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function PortalSidebar({ isOpen, onClose }: PortalSidebarProps) {
  const pathname = usePathname();
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
      <div className={styles.brand}>
        <div className={styles.brandMark}>
          <IconStorefront width={22} height={22} />
        </div>
        <div className={styles.brandText}>
          <strong>{Strings.portal.brandName}</strong>
          <small>{Strings.portal.brandTagline}</small>
        </div>
        <button
          type="button"
          className={styles.drawerClose}
          onClick={onClose}
          aria-label={Strings.portal.closeMenu}
        >
          <IconClose />
        </button>
      </div>

      <nav className={styles.nav}>
        {PORTAL_SIDEBAR_NAV_ITEMS.map(({ id, href, label, Icon, requiresActiveAccount }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          const isDisabled = requiresActiveAccount && !isActiveVendor;

          if (isDisabled) {
            return (
              <span
                key={id}
                className={`${styles.navItem} ${styles.navItemDisabled}`}
                title={Strings.nav.lockedHint}
                aria-disabled="true"
              >
                <Icon />
                {label}
              </span>
            );
          }

          return (
            <Link
              key={id}
              href={href}
              prefetch
              scroll={false}
              className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
              onClick={onClose}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          type="button"
          className={styles.sidebarLogout}
          onClick={onSignOutClick}
          disabled={isLoggingOut}
        >
          <IconLogout width={18} height={18} />
          <span>
            {isLoggingOut ? Strings.common.signingOut : Strings.nav.logOut}
          </span>
        </button>
      </div>
    </aside>
  );
}
