"use client";

import { FirebaseConfigErrorScreen } from "@/shared/components/config-error/FirebaseConfigErrorScreen";
import { useStrings } from "@/shared/preferences/PreferencesContext";

type FirebaseConfigErrorClientProps = {
  missingKeys: readonly string[];
  showDetails: boolean;
};

export function FirebaseConfigErrorClient({ missingKeys, showDetails }: FirebaseConfigErrorClientProps) {
  const strings = useStrings();
  return (
    <FirebaseConfigErrorScreen
      strings={strings}
      missingKeys={missingKeys}
      showDetails={showDetails}
    />
  );
}
