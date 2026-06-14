"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PortalHeaderActionsContextValue = {
  actions: ReactNode | null;
  setActions: (actions: ReactNode | null) => void;
};

const PortalHeaderActionsContext = createContext<PortalHeaderActionsContextValue | null>(
  null,
);

export function PortalHeaderActionsProvider({ children }: { children: ReactNode }) {
  const [actions, setActions] = useState<ReactNode | null>(null);
  const value = useMemo(() => ({ actions, setActions }), [actions]);

  return (
    <PortalHeaderActionsContext.Provider value={value}>
      {children}
    </PortalHeaderActionsContext.Provider>
  );
}

export function usePortalHeaderActions(): PortalHeaderActionsContextValue {
  const value = useContext(PortalHeaderActionsContext);
  if (!value) {
    throw new Error(
      "usePortalHeaderActions must be used within PortalHeaderActionsProvider",
    );
  }
  return value;
}
