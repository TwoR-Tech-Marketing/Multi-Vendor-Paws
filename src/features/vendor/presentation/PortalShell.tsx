"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { resolvePortalPageMeta } from "@/features/vendor/presentation/portal-nav";
import { PortalHeaderActionsProvider } from "@/features/vendor/presentation/PortalHeaderActionsContext";
import { PortalSidebar } from "@/features/vendor/presentation/PortalSidebar";
import { PortalTopbar } from "@/features/vendor/presentation/PortalTopbar";
import { usePortalCanGoBack } from "@/features/vendor/presentation/usePortalCanGoBack";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./portal.module.css";

type PortalShellProps = {
  children: ReactNode;
};

export function PortalShell({ children }: PortalShellProps) {
  const pathname = usePathname();
  const strings = useStrings();
  const canGoBack = usePortalCanGoBack();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const pageMeta = resolvePortalPageMeta(pathname, strings);

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

      <PortalHeaderActionsProvider>
        <PortalSidebar isOpen={isDrawerOpen} onClose={closeDrawer} />

        <div className={styles.main}>
          <PortalTopbar
            title={pageMeta.title}
            subtitle={pageMeta.subtitle}
            showBack={canGoBack}
            onMenuOpen={openDrawer}
            isMenuOpen={isDrawerOpen}
          />
          <div className={styles.content}>{children}</div>
        </div>
      </PortalHeaderActionsProvider>
    </div>
  );
}
