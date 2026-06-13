"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { Routes } from "@/constants/routes";
import { fetchCurrentSession } from "@/lib/auth-client";

type AuthGuestGuardProps = {
  children: ReactNode;
};

type GuardStatus = "checking" | "guest";

export function AuthGuestGuard({ children }: AuthGuestGuardProps) {
  const router = useRouter();
  const [status, setStatus] = useState<GuardStatus>("checking");

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const session = await fetchCurrentSession();
      if (cancelled) return;

      if (!session) {
        setStatus("guest");
        return;
      }

      if (session.sessionKind === "active") {
        router.replace(Routes.vendor.dashboard);
        return;
      }

      if (session.sessionKind === "pending" || session.sessionKind === "suspended") {
        router.replace(Routes.vendor.profile);
      }
    }

    void checkSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (status === "checking") {
    return <AuthPageSkeleton />;
  }

  return children;
}
