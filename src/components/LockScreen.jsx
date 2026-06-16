import { useState } from "react";

export default function LockScreen({ phrase, onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    if (input === phrase) onUnlock();
    else setError(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "var(--cream-50)",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 18, fontFamily: "var(--font-ui)",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "linear-gradient(140deg, #cd8459, #b8693d)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--cream-50)", fontFamily: "var(--font-display)", fontSize: 30, fontStyle: "italic",
      }}>a</div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-900)" }}>
        Ambre est verrouillé.
      </div>
      <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
        <input
          type="password"
          autoFocus
          value={input}
          onChange={e => { setInput(e.target.value); setError(false); }}
          placeholder="Phrase secrète"
          style={{
            padding: "10px 14px", borderRadius: 8, width: 240, textAlign: "center",
            border: error ? "1px solid var(--rose-500)" : "1px solid var(--line)",
            fontSize: 14, fontFamily: "var(--font-ui)", outline: "none",
            background: "var(--cream-100)", color: "var(--ink-900)",
          }}
        />
        {error && <div style={{ color: "var(--rose-500)", fontSize: 12 }}>Phrase incorrecte.</div>}
        <button type="submit" style={{
          padding: "9px 22px", borderRadius: 8, border: "1px solid var(--amber-500)",
          background: "var(--amber-500)", color: "var(--cream-50)", fontSize: 13, fontWeight: 500,
          cursor: "pointer", fontFamily: "var(--font-ui)",
        }}>
          Déverrouiller
        </button>
      </form>
    </div>
  );
}
