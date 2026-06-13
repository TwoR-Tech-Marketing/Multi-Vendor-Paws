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
import { Strings } from "@/constants/strings";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";

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
        title={Strings.signOut.confirmTitle}
        message={Strings.signOut.confirmMessage}
        confirmLabel={
          isLoggingOut ? Strings.common.signingOut : Strings.signOut.confirmAction
        }
        cancelLabel={Strings.common.cancel}
        isConfirming={isLoggingOut}
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    </PortalSignOutContext.Provider>
  );
}
