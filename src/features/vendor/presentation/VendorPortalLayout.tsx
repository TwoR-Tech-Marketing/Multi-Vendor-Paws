"use client";

import { PortalSessionProvider } from "@/features/vendor/presentation/PortalSessionContext";
import { PortalShell } from "@/features/vendor/presentation/PortalShell";

type VendorPortalLayoutProps = {
  children: React.ReactNode;
};

export function VendorPortalLayout({ children }: VendorPortalLayoutProps) {
  return (
    <PortalSessionProvider>
      <PortalShell>{children}</PortalShell>
    </PortalSessionProvider>
  );
}
