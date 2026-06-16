import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions, useCategories } from "../lib/store";
import { fmtEUR } from "../lib/chartPrimitives";

const ACTIONS = [
  { kind: "action", id: "import",  label: "Importer un relevé bancaire", sub: "CSV, OFX…",              icon: "↑" },
  { kind: "action", id: "add-tx",  label: "Ajouter une transaction",      sub: "Saisie manuelle",        icon: "+" },
  { kind: "action", id: "add-cat", label: "Créer une catégorie",          sub: "Avec règle optionnelle", icon: "⊕" },
  { kind: "action", id: "export",  label: "Exporter mes données",         sub: "CSV",                    icon: "↓" },
];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [transactions] = useTransactions();
  const [categories]   = useCategories();
  const [query, setQuery]           = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  );

  // Réinitialise et focus à l'ouverture
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Construit la liste plate des lignes selon la requête courante
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;
    const txRows = transactions
      .filter(t => (t.lbl || "").toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({ kind: "tx", id: t.id, label: t.lbl, data: t }));
    const catRows = categories
      .filter(c => c.id !== "inc" && c.label.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ kind: "cat", id: c.id, label: c.label, data: c }));
    return [...txRows, ...catRows];
  }, [query, transactions, categories]);

  // Navigation clavier
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "Escape")   { e.preventDefault(); onClose(); }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, rows.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); execute(rows[selectedIndex]); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, rows, selectedIndex]); // eslint-disable-line

  const execute = (row) => {
    if (!row) return;
    if (row.kind === "action") {
      handleAction(row.id);
    } else if (row.kind === "tx") {
      navigate("/transactions", { state: { selectedTxId: row.id } });
      onClose();
    } else if (row.kind === "cat") {
      navigate("/categories", { state: { selectedCatId: row.id } });
      onClose();
    }
  };

  const handleAction = (id) => {
    if (id === "import") {
      navigate("/import");
      onClose();
      return;
    }
    if (id === "add-tx") {
      navigate("/transactions", { state: { openAddForm: true } });
      onClose();
      return;
    }
    if (id === "add-cat") {
      navigate("/categories", { state: { openCreateForm: true } });
      onClose();
      return;
    }
    if (id === "export") {
      const header = "Date,Libellé,Sous-titre,Compte,Catégorie,Mode,Montant";
      const csvRows = transactions.map(t =>
        [t.d, `"${t.lbl}"`, `"${t.sub || ""}"`, t.acc, t.cat, t.mode, t.amt].join(",")
      );
      const csv = header + "\n" + csvRows.join("\n");
      const a = document.createElement("a");
      a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      a.download = "ambre-export.csv";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      onClose();
    }
  };

  const highlightMatch = (text) => {
    const q = query.trim().toLowerCase();
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: "var(--amber-500)", fontWeight: 600 }}>
          {text.slice(idx, idx + q.length)}
        </strong>
        {text.slice(idx + q.length)}
      </>
    );
  };

  if (!open) return null;

  const isSearching = query.trim().length > 0;
  const txRows  = rows.filter(r => r.kind === "tx");
  const catRows = rows.filter(r => r.kind === "cat");
  const noResults = isSearching && rows.length === 0;

  const renderRow = (row, index, label, sub, dotColor) => {
    const active = index === selectedIndex;
    return (
      <div
        key={row.kind + "-" + row.id}
        onClick={() => execute(row)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: active ? "8px 18px 8px 16px" : "8px 18px",
          borderLeft: active ? "2px solid var(--amber-500)" : "2px solid transparent",
          background: active ? "var(--amber-100)" : "transparent",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          borderRadius: dotColor ? "50%" : 6,
          background: dotColor || "var(--cream-200)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "var(--ink-600)",
        }}>
          {!dotColor && (row.icon || "›")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--ink-900)" }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 1 }}>{sub}</div>
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-400)", flexShrink: 0 }}>›</span>
      </div>
    );
  };

  const actionSection = !isSearching && (
    <>
      <div style={groupLabelStyle}>Actions rapides</div>
      {ACTIONS.map((a, i) => renderRow(a, i, a.label, a.sub, null))}
    </>
  );

  const txSection = isSearching && txRows.length > 0 && (
    <>
      <div style={groupLabelStyle}>
        Transactions · {txRows.length} résultat{txRows.length > 1 ? "s" : ""}
      </div>
      {txRows.map((r, i) => {
        const cat = catMap[r.data.cat];
        return renderRow(r, i, highlightMatch(r.label),
          `${r.data.d} · ${cat?.label || r.data.cat} · ${fmtEUR(r.data.amt)}`,
          cat?.color || "var(--cream-300)"
        );
      })}
    </>
  );

  const catSection = isSearching && catRows.length > 0 && (
    <>
      <div style={groupLabelStyle}>
        Catégories · {catRows.length} résultat{catRows.length > 1 ? "s" : ""}
      </div>
      {catRows.map((r, i) => renderRow(r, txRows.length + i, highlightMatch(r.label), "Catégorie", r.data.color))}
    </>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "var(--overlay-scrim)",
        backdropFilter: "blur(3px)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 120,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 580, background: "var(--cream-50)",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(42,28,16,0.40), 0 0 0 1px var(--line-strong)",
          overflow: "hidden", maxHeight: 560,
          display: "flex", flexDirection: "column",
          fontFamily: "var(--font-ui)",
        }}
      >
        {/* Barre de recherche */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px", borderBottom: "1px solid var(--line)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-500)" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Rechercher une transaction, une catégorie…"
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: "var(--font-ui)", fontSize: 15, color: "var(--ink-900)",
            }}
          />
          <span style={{
            fontSize: 10, color: "var(--ink-500)", fontFamily: "var(--font-mono)",
            background: "var(--cream-200)", padding: "2px 7px",
            borderRadius: 5, border: "1px solid var(--line)",
          }}>Ctrl+P</span>
        </div>

        {/* Résultats */}
        <div style={{ overflow: "auto", flex: 1 }}>
          {actionSection}
          {txSection}
          {catSection}
          {noResults && (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--ink-500)", fontSize: 13 }}>
              Aucun résultat pour « {query} »
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 18px", borderTop: "1px solid var(--line)",
          background: "var(--cream-100)", fontSize: 10, color: "var(--ink-500)",
          fontFamily: "var(--font-mono)", display: "flex", gap: 16,
        }}>
          <span>↑↓ naviguer</span><span>↩ ouvrir</span><span>Esc fermer</span>
        </div>
      </div>
    </div>
  );
}

const groupLabelStyle = {
  padding: "8px 18px 3px",
  fontSize: 10, color: "var(--ink-500)",
  letterSpacing: "0.1em", textTransform: "uppercase",
  fontFamily: "var(--font-mono)",
};
