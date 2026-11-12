import { Suspense } from "react";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { RegisterClient } from "@/features/auth/presentation/RegisterClient";
import { PreferencesProvider } from "@/shared/preferences/PreferencesContext";

export default function RegisterPage() {
  return (
    <PreferencesProvider>
      <Suspense fallback={<AuthPageSkeleton />}>
        <RegisterClient />
      </Suspense>
    </PreferencesProvider>
  );
}
