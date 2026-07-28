export default function HomePage() {
  return (
    <main
      style={{
        padding: "4rem 2rem",
        textAlign: "center",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          fontSize: "3rem",
          marginBottom: "1rem",
          background: "linear-gradient(135deg, #6c5ce7, #00b894)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Cognitive Engine
      </h1>
      <p
        style={{
          fontSize: "1.25rem",
          color: "#a0aec0",
          maxWidth: "600px",
          lineHeight: "1.6",
          marginBottom: "2rem",
        }}
      >
        An AI-powered cognitive architecture for human thought augmentation.
      </p>
      <div
        style={{
          padding: "1rem 1.5rem",
          borderRadius: "8px",
          border: "1px solid #232834",
          backgroundColor: "#161a22",
          fontSize: "0.9rem",
          color: "#00b894",
        }}
      >
        Infrastructure Baseline v0.1 — Sprint 1A Ready
      </div>
    </main>
  );
}
