"use client";

import { PortalSessionProvider } from "@/features/vendor/presentation/PortalSessionContext";
import { PortalShell } from "@/features/vendor/presentation/PortalShell";
import { PortalSignOutProvider } from "@/features/vendor/presentation/PortalSignOutContext";
import { PreferencesProvider } from "@/shared/preferences/PreferencesContext";

type VendorPortalLayoutProps = {
  children: React.ReactNode;
};

export function VendorPortalLayout({ children }: VendorPortalLayoutProps) {
  return (
    <PreferencesProvider>
      <PortalSessionProvider>
        <PortalSignOutProvider>
          <PortalShell>{children}</PortalShell>
        </PortalSignOutProvider>
      </PortalSessionProvider>
    </PreferencesProvider>
  );
}
