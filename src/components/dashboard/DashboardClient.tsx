"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";

import { signOutVendor, subscribeAuthState } from "@/lib/auth";

export function DashboardClient() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeAuthState((nextUser) => {
      if (!nextUser) {
        router.replace("/login");
      }
      setUser(nextUser);
      setIsLoading(false);
    });

    return unsubscribe;
  }, [router]);

  async function onLogout() {
    setIsLoggingOut(true);
    await signOutVendor();
    router.replace("/login");
  }

  if (isLoading) {
    return (
      <main style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <p>Loading your vendor identity...</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <main style={{ minHeight: "100vh", padding: "32px" }}>
      <section
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Vendor Dashboard</h1>
        <p style={{ color: "#4b5563" }}>
          You are now connected to Tender Paws Firebase identity.
        </p>

        <div style={{ marginTop: "18px" }}>
          <p style={{ margin: "6px 0" }}>
            <strong>UID:</strong> {user.uid}
          </p>
          <p style={{ margin: "6px 0" }}>
            <strong>Email:</strong> {user.email ?? "No email available"}
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          style={{
            marginTop: "18px",
            border: 0,
            borderRadius: "8px",
            padding: "10px 14px",
            background: "#111827",
            color: "#fff",
            cursor: isLoggingOut ? "not-allowed" : "pointer",
          }}
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </section>
    </main>
  );
}
