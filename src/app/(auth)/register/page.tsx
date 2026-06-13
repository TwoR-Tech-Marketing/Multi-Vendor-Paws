import { Suspense } from "react";

import { AuthPageSkeleton } from "@/features/auth/presentation/AuthPageSkeleton";
import { RegisterClient } from "@/features/auth/presentation/RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <RegisterClient />
    </Suspense>
  );
}
