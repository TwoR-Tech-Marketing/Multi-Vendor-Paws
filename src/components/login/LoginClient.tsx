"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FirebaseError } from "firebase/app";

import { signInVendor } from "@/lib/auth";

function getErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Invalid email or password.";
      default:
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return "Unable to sign in right now.";
}

export function LoginClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signInVendor(email.trim(), password);
      router.push("/dashboard");
    } catch (signInError) {
      setError(getErrorMessage(signInError));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "24px",
        }}
      >
        <h1 style={{ marginTop: 0 }}>Tender Paws Vendor Login</h1>
        <p style={{ marginBottom: "20px", color: "#4b5563" }}>
          Sign in with your vendor identity to access your dashboard.
        </p>

        <form onSubmit={onSubmit}>
          <label htmlFor="email" style={{ display: "block", marginBottom: "8px" }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "12px",
            }}
          />

          <label htmlFor="password" style={{ display: "block", marginBottom: "8px" }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={{
              width: "100%",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "10px 12px",
              marginBottom: "12px",
            }}
          />

          {error ? (
            <p
              role="alert"
              style={{ margin: "0 0 12px", color: "#b91c1c", fontSize: "14px" }}
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              border: 0,
              borderRadius: "8px",
              padding: "12px 16px",
              background: "#111827",
              color: "#fff",
              cursor: isSubmitting ? "not-allowed" : "pointer",
            }}
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
      </section>
    </main>
  );
}
