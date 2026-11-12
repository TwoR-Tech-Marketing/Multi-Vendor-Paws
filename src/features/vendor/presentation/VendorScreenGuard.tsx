"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Routes } from "@/constants/routes";
import {
  isScreenVisible,
  type VendorScreenKey,
} from "@/features/vendor/domain/vendor-type-config";
import { PortalContentSkeleton } from "@/features/vendor/presentation/PortalContentSkeleton";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";

type VendorScreenGuardProps = {
  screen: VendorScreenKey;
  children: ReactNode;
};

/**
 * Sends a vendor whose type does not have `screen` visible back to the
 * dashboard (S1.7). UX only: the BFF and callables stay the authorization.
 */
export function VendorScreenGuard({ screen, children }: VendorScreenGuardProps) {
  const router = useRouter();
  const { profile } = usePortalSession();
  const allowed = isScreenVisible(profile.vendorType, screen);

  useEffect(() => {
    if (!allowed) {
      router.replace(Routes.vendor.dashboard);
    }
  }, [allowed, router]);

  if (!allowed) {
    return <PortalContentSkeleton />;
  }

  return children;
}
