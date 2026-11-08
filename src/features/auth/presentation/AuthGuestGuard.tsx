"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { portalPostLoginHref } from "@/features/auth/domain/portal-account-gate";
import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
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
      try {
        const session = await fetchCurrentSession();
        if (cancelled) return;

        if (!session) {
          setStatus("guest");
          return;
        }

        const nextHref = portalPostLoginHref(session.sessionKind);
        if (nextHref) {
          router.replace(nextHref);
        }
      } catch {
        if (!cancelled) {
          setStatus("guest");
        }
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
