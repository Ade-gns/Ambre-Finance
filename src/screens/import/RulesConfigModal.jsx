import { useMemo, useState } from "react";
import { useTransactions, useCategories, useAutoRules, applyRules, reapplyRules } from "../../lib/store";
import { IcPlus } from "../../lib/icons";
import { simplifyLabel } from "./csvParser";

/* ─────────────────────────────────────────────────────────────────
   Modal — configuration des règles automatiques
   ───────────────────────────────────────────────────────────────── */
export default function RulesConfigModal({ txs, existingRules, onSave, onClose }) {
  const [categories]                    = useCategories();
  const [, setTransactions] = useTransactions();
  const [autoRulesStore, setAutoRulesStore] = useAutoRules();
  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const suggestions = useMemo(() => {
    const seen = new Map();
    (txs || []).forEach(t => {
      const key = simplifyLabel(t.lbl);
      if (!key || key.length < 3) return;
      if (!seen.has(key)) seen.set(key, { pattern: key, origLbl: t.lbl, cat: t.cat, count: 0 });
      const e = seen.get(key);
      e.count++;
      if (t.cat && t.cat !== "aut") e.cat = t.cat;
    });
    return [...seen.values()].sort((a, b) => b.count - a.count).slice(0, 20);
  }, [txs]);

  const [selected, setSelected] = useState(() => {
    const init = {};
    suggestions.forEach((s, i) => { init[i] = s.cat != null && s.cat !== "aut"; });
    return init;
  });
  const [catOverrides, setCatOverrides]   = useState({});
  const [catPickerIdx, setCatPickerIdx]   = useState(null);
  const [customPattern, setCustomPattern] = useState("");
  const [customCatId, setCustomCatId]     = useState(null);
  const [customCatOpen, setCustomCatOpen] = useState(false);

  const selectedCount = Object.values(selected).filter(Boolean).length;

  const handleSave = () => {
    const existing = (existingRules || []).filter(r => !suggestions.some(s => s.pattern === r.pattern));
    const newRules = [
      ...existing,
      ...suggestions
        .filter((_, i) => selected[i])
        .map((s, i) => ({
          id: Date.now() + i,
          pattern: s.pattern,
          catId: catOverrides[i] || s.cat || "aut",
          matchType: "contains",
          active: true,
          createdAt: new Date().toISOString(),
        })),
    ];
    setAutoRulesStore(newRules);
    setTransactions(prev => reapplyRules(prev, newRules, true));
    onSave(newRules);
  };

  const addCustomRule = () => {
    if (!customPattern.trim() || !customCatId) return;
    const newRule = { id: Date.now(), pattern: customPattern.toLowerCase().trim(),
      catId: customCatId, matchType: "contains", active: true, createdAt: new Date().toISOString() };
    setAutoRulesStore([newRule, ...autoRulesStore]); // priorité max
    setTransactions(prev => prev.map(t => {
      const cat = applyRules([newRule], t.lbl);
      return cat ? { ...t, cat } : t;
    }));
    setCustomPattern(""); setCustomCatId(null);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div style={{
        background: "var(--cream-50)", borderRadius: 16, width: 560, maxHeight: "78vh",
        boxShadow: "0 24px 60px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 24px 14px", borderBottom: "1px solid var(--line)",
                      display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--ink-900)" }}>
              Règles automatiques
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 3 }}>
              Sélectionnez les libellés à mémoriser pour les prochains imports.
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, border: "1px solid var(--line)", borderRadius: 7,
            background: "var(--cream-100)", cursor: "pointer", fontSize: 18,
            display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-600)",
          }}>×</button>
        </div>

        {/* Liste */}
        <div style={{ overflow: "auto", flex: 1 }} onClick={() => setCatPickerIdx(null)}>
          {suggestions.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--ink-500)", fontSize: 13 }}>
              Aucun libellé détecté.
            </div>
          ) : suggestions.map((s, i) => {
            const catId   = catOverrides[i] || s.cat;
            const catInfo = catId ? catById[catId] : null;
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "24px 1fr auto",
                alignItems: "center", gap: 14, padding: "10px 24px",
                borderBottom: "1px dashed var(--line)",
                opacity: selected[i] ? 1 : 0.4, transition: "opacity 0.15s",
              }}>
                {/* Toggle */}
                <div onClick={() => setSelected(p => ({ ...p, [i]: !p[i] }))} style={{
                  width: 18, height: 18, borderRadius: 5, cursor: "pointer", flexShrink: 0,
                  border: selected[i] ? "none" : "1.5px solid var(--line-strong)",
                  background: selected[i] ? "var(--amber-500)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {selected[i] && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2.2">
                      <path d="M2 6l3 3 5-5"/>
                    </svg>
                  )}
                </div>
                {/* Label */}
                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-800)", fontFamily: "var(--font-mono)" }}>
                    {s.origLbl}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--ink-500)", marginTop: 2 }}>
                    contient « {s.pattern} » · {s.count} fois
                  </div>
                </div>
                {/* Category picker */}
                <div style={{ position: "relative" }}>
                  <button onClick={e => { e.stopPropagation(); setCatPickerIdx(catPickerIdx === i ? null : i); }} style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 8, fontSize: 11, cursor: "pointer",
                    border: `1px solid ${catInfo ? catInfo.color + "55" : "rgba(184,105,61,0.4)"}`,
                    background: catInfo ? "transparent" : "var(--amber-100)",
                    color: catInfo ? catInfo.color : "var(--amber-500)",
                  }}>
                    {catInfo ? catInfo.label : "Choisir"}
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M2 4l4 4 4-4"/>
                    </svg>
                  </button>
                  {catPickerIdx === i && (
                    <div style={{
                      position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 10,
                      background: "var(--cream-50)", border: "1px solid var(--amber-500)",
                      borderRadius: 10, padding: 6, minWidth: 150,
                      boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                    }} onClick={e => e.stopPropagation()}>
                      {categories.filter(c => c.id !== "inc").map(c => (
                        <div key={c.id} onClick={() => { setCatOverrides(p => ({ ...p, [i]: c.id })); setCatPickerIdx(null); }}
                             style={{
                               display: "flex", alignItems: "center", gap: 8,
                               padding: "7px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12,
                               background: catId === c.id ? "var(--amber-100)" : undefined,
                               color: catId === c.id ? "var(--amber-500)" : "var(--ink-800)",
                             }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }}/>
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Règle personnalisée */}
        <div style={{ padding: "10px 24px", borderTop: "1px solid var(--line)",
                      background: "var(--cream-100)" }}
             onClick={() => setCustomCatOpen(false)}>
          <div style={{ fontSize: 11, color: "var(--ink-500)", marginBottom: 6, fontWeight: 500 }}>
            Ajouter une règle manuellement
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input value={customPattern} onChange={e => setCustomPattern(e.target.value)}
                   onKeyDown={e => e.key === "Enter" && addCustomRule()}
                   placeholder='ex. "intermarché", "prime video"…'
                   style={{ flex: 1, padding: "6px 10px", borderRadius: 7, fontSize: 12,
                            border: "1px solid var(--line)", background: "var(--cream-50)",
                            color: "var(--ink-800)", outline: "none" }}/>
            <div style={{ position: "relative" }} onClick={e => e.stopPropagation()}>
              <button onClick={() => setCustomCatOpen(o => !o)} style={{
                padding: "6px 10px", borderRadius: 7, border: "1px solid var(--line)",
                background: "var(--cream-50)", fontSize: 11, cursor: "pointer", whiteSpace: "nowrap",
                color: customCatId ? (catById[customCatId]?.color || "var(--ink-700)") : "var(--ink-500)",
                display: "flex", alignItems: "center", gap: 4, minWidth: 110,
              }}>
                {customCatId ? catById[customCatId]?.label : "Catégorie…"}
                <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 4l4 4 4-4"/>
                </svg>
              </button>
              {customCatOpen && (
                <div style={{
                  position: "absolute", right: 0, bottom: "calc(100% + 4px)", zIndex: 20,
                  background: "var(--cream-50)", border: "1px solid var(--amber-500)",
                  borderRadius: 10, padding: 6, minWidth: 150,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.12)", maxHeight: 200, overflow: "auto",
                }}>
                  {categories.filter(c => c.id !== "inc").map(c => (
                    <div key={c.id} onClick={() => { setCustomCatId(c.id); setCustomCatOpen(false); }}
                         style={{ display: "flex", alignItems: "center", gap: 8,
                                  padding: "7px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12,
                                  background: customCatId === c.id ? "var(--amber-100)" : undefined,
                                  color: customCatId === c.id ? "var(--amber-500)" : "var(--ink-800)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }}/>
                      {c.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button onClick={addCustomRule} disabled={!customPattern.trim() || !customCatId} style={{
              padding: "6px 12px", borderRadius: 7, border: "none", fontSize: 12, fontWeight: 500,
              cursor: customPattern.trim() && customCatId ? "pointer" : "not-allowed",
              background: customPattern.trim() && customCatId ? "var(--amber-500)" : "var(--cream-200)",
              color: customPattern.trim() && customCatId ? "var(--cream-50)" : "var(--ink-500)",
              display: "flex", alignItems: "center", gap: 4,
            }}>
              <IcPlus size={11}/>Ajouter
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line)",
                      display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onClose} style={{
            padding: "7px 14px", borderRadius: 8, fontSize: 12,
            border: "1px solid var(--line)", background: "var(--cream-50)",
            color: "var(--ink-600)", cursor: "pointer",
          }}>Annuler</button>
          <button onClick={handleSave} disabled={selectedCount === 0} style={{
            padding: "7px 16px", borderRadius: 8, fontSize: 12, fontWeight: 500,
            border: "none", cursor: selectedCount > 0 ? "pointer" : "not-allowed",
            background: selectedCount > 0 ? "var(--amber-500)" : "var(--cream-200)",
            color: selectedCount > 0 ? "var(--cream-50)" : "var(--ink-500)",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            Créer {selectedCount} règle{selectedCount > 1 ? "s" : ""}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M2 6h8M6 2l4 4-4 4"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

