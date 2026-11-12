import type { ReactNode } from "react";

import { AuthGuestGuard } from "@/features/auth/presentation/AuthGuestGuard";
import { FirebaseConfigGate } from "@/shared/components/config-error/FirebaseConfigGate";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <FirebaseConfigGate>
      <AuthGuestGuard>{children}</AuthGuestGuard>
    </FirebaseConfigGate>
  );
}
