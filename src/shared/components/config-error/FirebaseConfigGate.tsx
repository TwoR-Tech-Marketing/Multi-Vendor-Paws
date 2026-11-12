import type { ReactNode } from "react";

import { isProduction } from "@/lib/env.shared";
import { getMissingFirebaseClientEnvKeys } from "@/lib/firebase-client-env";
import { FirebaseConfigErrorClient } from "@/shared/components/config-error/FirebaseConfigErrorClient";
import { PreferencesProvider } from "@/shared/preferences/PreferencesContext";

type FirebaseConfigGateProps = {
  children: ReactNode;
};

/**
 * Renders a configuration screen instead of the route tree when the browser
 * Firebase settings are missing. Variable names are sent to the page only
 * outside production builds.
 */
export function FirebaseConfigGate({ children }: FirebaseConfigGateProps) {
  const missingKeys = getMissingFirebaseClientEnvKeys();
  if (missingKeys.length === 0) return children;

  const showDetails = !isProduction();
  return (
    <PreferencesProvider>
      <FirebaseConfigErrorClient
        missingKeys={showDetails ? missingKeys : []}
        showDetails={showDetails}
      />
    </PreferencesProvider>
  );
}
