// Placeholder utilisé pour les écrans pas encore intégrés.
// Sera remplacé un par un dans les prochains messages.

export default function Placeholder({ title, description }) {
  return (
    <main style={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      padding: 40,
      background: "#efe7d6",
      color: "var(--ink-800)",
      height: "100%",
    }}>
      <div style={{
        fontFamily: "var(--font-display)",
        fontSize: 42,
        color: "var(--ink-900)",
        letterSpacing: "-0.02em",
      }}>
        {title}
      </div>
      <div style={{
        fontSize: 14,
        color: "var(--ink-500)",
        textAlign: "center",
        maxWidth: 480,
        lineHeight: 1.5,
      }}>
        {description || "Cet écran sera intégré dans la prochaine étape."}
      </div>
      <div style={{
        marginTop: 20,
        padding: "8px 14px",
        background: "var(--amber-100)",
        color: "var(--amber-500)",
        borderRadius: 999,
        fontSize: 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
      }}>
        En préparation
      </div>
    </main>
  );
}
