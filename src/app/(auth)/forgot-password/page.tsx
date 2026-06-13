import { Suspense } from "react";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { ForgotPasswordClient } from "@/features/auth/presentation/ForgotPasswordClient";

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <ForgotPasswordClient />
    </Suspense>
  );
}
