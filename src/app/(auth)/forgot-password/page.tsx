import { Suspense } from "react";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { ForgotPasswordClient } from "@/features/auth/presentation/ForgotPasswordClient";
import { PreferencesProvider } from "@/shared/preferences/PreferencesContext";

export default function ForgotPasswordPage() {
  return (
    <PreferencesProvider>
      <Suspense fallback={<AuthPageSkeleton />}>
        <ForgotPasswordClient />
      </Suspense>
    </PreferencesProvider>
  );
}
