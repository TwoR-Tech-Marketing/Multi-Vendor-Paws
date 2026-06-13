"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { LogoutConfirmDialog } from "@/components/ui/LogoutConfirmDialog";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { useStrings } from "@/shared/preferences/PreferencesContext";

type PortalSignOutContextValue = {
  requestSignOut: () => void;
};

const PortalSignOutContext = createContext<PortalSignOutContextValue | null>(
  null,
);

export function usePortalSignOut(): PortalSignOutContextValue {
  const value = useContext(PortalSignOutContext);
  if (!value) {
    throw new Error("usePortalSignOut must be used within PortalSignOutProvider");
  }
  return value;
}

type PortalSignOutProviderProps = {
  children: ReactNode;
};

export function PortalSignOutProvider({ children }: PortalSignOutProviderProps) {
  const { signOut, isLoggingOut } = usePortalSession();
  const strings = useStrings();
  const [open, setOpen] = useState(false);

  const requestSignOut = useCallback(() => {
    setOpen(true);
  }, []);

  const onCancel = useCallback(() => {
    if (isLoggingOut) return;
    setOpen(false);
  }, [isLoggingOut]);

  const onConfirm = useCallback(async () => {
    setOpen(false);
    await signOut();
  }, [signOut]);

  const value = useMemo(() => ({ requestSignOut }), [requestSignOut]);

  return (
    <PortalSignOutContext.Provider value={value}>
      {children}
      <LogoutConfirmDialog
        open={open}
        title={strings.signOut.confirmTitle}
        message={strings.signOut.confirmMessage}
        confirmLabel={
          isLoggingOut ? strings.common.signingOut : strings.signOut.confirmAction
        }
        cancelLabel={strings.common.cancel}
        isConfirming={isLoggingOut}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </PortalSignOutContext.Provider>
  );
}
