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
import { goOfflineQuietly } from "@/features/telehealth/application/telehealth.api";
import { normalizeVendorType } from "@/features/vendor/domain/vendor-type-config";
import { PortalShellSkeleton } from "@/features/vendor/presentation/PortalShellSkeleton";
import { signOutVendor } from "@/lib/auth";
import { fetchCurrentSession, logoutServerSession } from "@/lib/auth-client";
import { usePreferences } from "@/shared/preferences/PreferencesContext";
import {
  normalizeVendorPreferences,
  type PreferencesScope,
} from "@/shared/preferences/domain/types";

type PortalSessionContextValue = {
  user: PortalUserDto;
  profile: VendorProfile;
  sessionKind: VendorSessionKind;
  isActiveVendor: boolean;
  /** True only when the session profile marks a test account. */
  isTestAccount: boolean;
  isLoggingOut: boolean;
  storeBranding: {
    storeName: string;
    logoUrl: string | null;
  };
  /** "account" when appearance and language changes are saved on the account. */
  preferencesScope: PreferencesScope;
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
    isTestAccount: dto.profile.isTest === true,
    isLoggingOut: false,
    storeBranding: dto.storeBranding,
    preferencesScope: dto.preferencesScope === "account" ? "account" : "local",
    refreshStoreBranding: async () => {},
    signOut: async () => {},
  };
}

/**
 * Reads the server session. Without one, also signs out any client Firebase
 * user left from an earlier account.
 */
export async function loadPortalSession(): Promise<VendorSessionDto | null> {
  const dto = await fetchCurrentSession();
  if (!dto) await signOutVendor().catch(() => undefined);
  return dto;
}

/** Ends the server session, then always signs the client Firebase user out. */
export async function endPortalSession(isDoctor: boolean): Promise<void> {
  try {
    // Doctors leave the telehealth queue before the session ends.
    if (isDoctor) await goOfflineQuietly();
    await logoutServerSession();
  } finally {
    await signOutVendor().catch(() => undefined);
  }
}

export function PortalSessionProvider({ children }: PortalSessionProviderProps) {
  const router = useRouter();
  const { applyAccountPreferences } = usePreferences();
  const [session, setSession] = useState<PortalSessionContextValue | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const bootstrap = useCallback(async () => {
    const dto = await loadPortalSession();

    if (!dto) {
      router.replace(Routes.auth.login);
      return null;
    }

    // The account value replaces the device cache once the session loads.
    if (dto.preferencesScope === "account") {
      applyAccountPreferences(normalizeVendorPreferences(dto.preferences));
    }

    return mapSessionDto(dto);
  }, [router, applyAccountPreferences]);

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
            isTestAccount: dto.profile.isTest === true,
          }
        : current,
    );
  }, []);

  const isDoctor = normalizeVendorType(session?.profile.vendorType) === "doctor";

  const signOut = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await endPortalSession(isDoctor);
    } finally {
      router.replace(Routes.auth.login);
    }
  }, [router, isDoctor]);

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
