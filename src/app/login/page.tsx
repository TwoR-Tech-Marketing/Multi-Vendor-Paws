import { Suspense } from "react";

import { LoginClient } from "@/features/auth/presentation/LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>Loading...</main>}>
      <LoginClient />
    </Suspense>
  );
}
