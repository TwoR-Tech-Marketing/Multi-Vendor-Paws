"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { Routes } from "@/constants/routes";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { PortalContentSkeleton } from "@/features/vendor/presentation/PortalContentSkeleton";

type ActiveVendorGuardProps = {
  children: ReactNode;
};

export function ActiveVendorGuard({ children }: ActiveVendorGuardProps) {
  const router = useRouter();
  const { isActiveVendor } = usePortalSession();

  useEffect(() => {
    if (!isActiveVendor) {
      router.replace(Routes.vendor.accountStatus);
    }
  }, [isActiveVendor, router]);

  if (!isActiveVendor) {
    return <PortalContentSkeleton />;
  }

  return children;
}
