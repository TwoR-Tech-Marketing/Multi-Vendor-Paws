"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { resolveVendorSession } from "@/features/auth/infrastructure/resolve-vendor-session";
import { Routes } from "@/constants/routes";
import { signOutVendor, subscribeAuthState } from "@/lib/auth";

type AuthGuestGuardProps = {
  children: ReactNode;
};

type GuardStatus = "checking" | "guest";

export function AuthGuestGuard({ children }: AuthGuestGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GuardStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    const unsubscribe = subscribeAuthState(async (user) => {
      if (cancelled) return;

      if (!user) {
        setStatus("guest");
        return;
      }

      const session = await resolveVendorSession(user);
      if (cancelled) return;

      if (session.kind === "active") {
        router.replace(Routes.vendor.dashboard);
        return;
      }

      if (session.kind === "pending" || session.kind === "suspended") {
        router.replace(Routes.vendor.profile);
        return;
      }

      await signOutVendor();
      if (!cancelled) {
        setStatus("guest");
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [router]);

  if (status === "checking") {
    return <AuthPageSkeleton />;
  }

  return children;
}
