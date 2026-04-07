"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f6f1eb",
          color: "#1c2826",
        }}
      >
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#7a8a84", marginBottom: "1.5rem" }}>
            An unexpected error occurred.
          </p>
          <button
            onClick={reset}
            style={{
              background: "#2d5a3d",
              color: "#f6f1eb",
              border: "none",
              padding: "0.5rem 1.5rem",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
