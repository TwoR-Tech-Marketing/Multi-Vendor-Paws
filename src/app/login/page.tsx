export default function LoginPage() {
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
        <h1 style={{ marginTop: 0 }}>Vendor Login</h1>
        <p style={{ marginBottom: "20px", color: "#4b5563" }}>
          Firebase auth screen placeholder for Multi-Vendor-Paws.
        </p>
        <button
          type="button"
          style={{
            width: "100%",
            border: 0,
            borderRadius: "8px",
            padding: "12px 16px",
            background: "#111827",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Continue
        </button>
      </section>
    </main>
  );
}
