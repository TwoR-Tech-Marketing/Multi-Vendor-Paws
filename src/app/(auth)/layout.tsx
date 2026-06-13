import type { ReactNode } from "react";

import { AuthGuestGuard } from "@/features/auth/presentation/AuthGuestGuard";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthGuestGuard>{children}</AuthGuestGuard>;
}
