import { Suspense } from "react";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { LoginClient } from "@/features/auth/presentation/LoginClient";
import { PreferencesProvider } from "@/shared/preferences/PreferencesContext";

export default function LoginPage() {
  return (
    <PreferencesProvider>
      <Suspense fallback={<AuthPageSkeleton />}>
        <LoginClient />
      </Suspense>
    </PreferencesProvider>
  );
}
