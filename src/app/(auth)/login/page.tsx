import { Suspense } from "react";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { LoginClient } from "@/features/auth/presentation/LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <LoginClient />
    </Suspense>
  );
}
