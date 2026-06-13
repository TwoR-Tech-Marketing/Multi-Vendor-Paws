"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import {
  PORTAL_PAGE_META,
  resolvePortalNavId,
} from "@/features/vendor/presentation/portal-nav";
import { PortalSidebar } from "@/features/vendor/presentation/PortalSidebar";
import { PortalTopbar } from "@/features/vendor/presentation/PortalTopbar";

import styles from "./portal.module.css";

type PortalShellProps = {
  children: ReactNode;
};

export function PortalShell({ children }: PortalShellProps) {
  const pathname = usePathname();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const navId = resolvePortalNavId(pathname);
  const pageMeta = PORTAL_PAGE_META[navId];

  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  return (
    <div className={styles.shell}>
      <div
        className={`${styles.backdrop} ${isDrawerOpen ? styles.backdropVisible : ""}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      <PortalSidebar isOpen={isDrawerOpen} onClose={closeDrawer} />

      <div className={styles.main}>
        <PortalTopbar
          title={pageMeta.title}
          subtitle={pageMeta.subtitle}
          onMenuOpen={openDrawer}
          isMenuOpen={isDrawerOpen}
        />
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
