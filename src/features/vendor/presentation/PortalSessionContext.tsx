"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { Routes } from "@/constants/routes";
import { signOutVendor, subscribeAuthState } from "@/lib/auth";
import {
  resolveVendorSession,
  type VendorSessionKind,
} from "@/features/auth/infrastructure/resolve-vendor-session";
import type { VendorProfile } from "@/features/auth/domain/types";
import { PortalShellSkeleton } from "@/features/vendor/presentation/PortalShellSkeleton";

type PortalSessionContextValue = {
  user: User;
  profile: VendorProfile;
  sessionKind: VendorSessionKind;
  isActiveVendor: boolean;
  isLoggingOut: boolean;
  signOut: () => Promise<void>;
};

const PortalSessionContext = createContext<PortalSessionContextValue | null>(
  null,
);

export function usePortalSession(): PortalSessionContextValue {
  const value = useContext(PortalSessionContext);
  if (!value) {
    throw new Error("usePortalSession must be used within PortalSessionProvider");
  }
  return value;
}

type PortalSessionProviderProps = {
  children: ReactNode;
};

export function PortalSessionProvider({ children }: PortalSessionProviderProps) {
  const router = useRouter();
  const hasResolvedSessionRef = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [sessionKind, setSessionKind] = useState<VendorSessionKind | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuthState(async (nextUser) => {
      if (!nextUser) {
        if (!hasResolvedSessionRef.current) {
          router.replace(Routes.auth.login);
        }
        return;
      }

      const session = await resolveVendorSession(nextUser);

      if (
        session.kind === "mobile_app_account" ||
        session.kind === "wrong_sign_in_email" ||
        session.kind === "not_vendor"
      ) {
        await signOutVendor();
        router.replace(`${Routes.auth.login}?invalid=1`);
        return;
      }

      if (
        session.kind === "active" ||
        session.kind === "pending" ||
        session.kind === "suspended"
      ) {
        setUser(nextUser);
        setProfile(session.profile!);
        setSessionKind(session.kind);
        hasResolvedSessionRef.current = true;
        setIsBootstrapping(false);
        return;
      }

      await signOutVendor();
      router.replace(Routes.auth.login);
    });

    return unsubscribe;
  }, [router]);

  const signOut = useCallback(async () => {
    setIsLoggingOut(true);
    hasResolvedSessionRef.current = false;
    await signOutVendor();
    router.replace(Routes.auth.login);
  }, [router]);

  const value = useMemo(() => {
    if (!user || !profile || !sessionKind) return null;

    return {
      user,
      profile,
      sessionKind,
      isActiveVendor: sessionKind === "active",
      isLoggingOut,
      signOut,
    };
  }, [user, profile, sessionKind, isLoggingOut, signOut]);

  if (isBootstrapping && !hasResolvedSessionRef.current) {
    return <PortalShellSkeleton />;
  }

  if (!value) {
    return <PortalShellSkeleton />;
  }

  return (
    <PortalSessionContext.Provider value={value}>
      {children}
    </PortalSessionContext.Provider>
  );
}
