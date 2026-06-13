"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { Routes } from "@/constants/routes";
import type { PortalUserDto, VendorSessionDto } from "@/features/auth/domain/session-dto";
import type { VendorProfile } from "@/features/auth/domain/types";
import type { VendorSessionKind } from "@/features/auth/infrastructure/resolve-vendor-session";
import { PortalShellSkeleton } from "@/features/vendor/presentation/PortalShellSkeleton";
import { fetchCurrentSession, logoutServerSession } from "@/lib/auth-client";

type PortalSessionContextValue = {
  user: PortalUserDto;
  profile: VendorProfile;
  sessionKind: VendorSessionKind;
  isActiveVendor: boolean;
  isLoggingOut: boolean;
  storeBranding: {
    storeName: string;
    logoUrl: string | null;
  };
  refreshStoreBranding: () => Promise<void>;
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

function mapSessionDto(dto: VendorSessionDto): PortalSessionContextValue {
  return {
    user: dto.user,
    profile: dto.profile,
    sessionKind: dto.sessionKind,
    isActiveVendor: dto.sessionKind === "active",
    isLoggingOut: false,
    storeBranding: dto.storeBranding,
    refreshStoreBranding: async () => {},
    signOut: async () => {},
  };
}

export function PortalSessionProvider({ children }: PortalSessionProviderProps) {
  const router = useRouter();
  const [session, setSession] = useState<PortalSessionContextValue | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const bootstrap = useCallback(async () => {
    const dto = await fetchCurrentSession();

    if (!dto) {
      router.replace(Routes.auth.login);
      return null;
    }

    return mapSessionDto(dto);
  }, [router]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const next = await bootstrap();
      if (cancelled) return;
      if (next) {
        setSession(next);
      }
      setIsBootstrapping(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrap]);

  const refreshStoreBranding = useCallback(async () => {
    const dto = await fetchCurrentSession();
    if (!dto) return;

    setSession((current) =>
      current
        ? {
            ...current,
            storeBranding: dto.storeBranding,
            profile: dto.profile,
            sessionKind: dto.sessionKind,
            isActiveVendor: dto.sessionKind === "active",
          }
        : current,
    );
  }, []);

  const signOut = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await logoutServerSession();
    } finally {
      router.replace(Routes.auth.login);
    }
  }, [router]);

  const value = useMemo(() => {
    if (!session) return null;

    return {
      ...session,
      isLoggingOut,
      refreshStoreBranding,
      signOut,
    };
  }, [session, isLoggingOut, refreshStoreBranding, signOut]);

  if (isBootstrapping || !value) {
    return <PortalShellSkeleton />;
  }

  return (
    <PortalSessionContext.Provider value={value}>
      {children}
    </PortalSessionContext.Provider>
  );
}
