import { useState, useRef, useEffect } from "react";
import { useCategories, autoCat } from "../../lib/store";
import { useEscapeKey } from "../../lib/useEscapeKey";

/* ─────────────────────────────────────────────────────────────────
   Modal d'ajout manuel de transaction
   ───────────────────────────────────────────────────────────────── */
const DOW_FR_MODAL = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MODES_LIST   = ["CB","VIR","PRLV","ESP","CHQ"];

export default function TxAddModal({ onClose, onAdd }) {
  const [catDefs] = useCategories();
  const today = new Date();
  const pad = n => String(n).padStart(2, "0");
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;

  const [dateVal,   setDateVal]   = useState(todayStr);
  const [lbl,       setLbl]       = useState("");
  const [sub,       setSub]       = useState("");
  const [amtStr,    setAmtStr]    = useState("");
  const [isExpense, setIsExpense] = useState(true);
  const [cat,       setCat]       = useState("aut");
  const [acc,       setAcc]       = useState("CCP");
  const [mode,      setMode]      = useState("CB");
  const [catOpen,   setCatOpen]   = useState(false);
  const catRef = useRef(null);

  // Ferme le picker catégorie si clic extérieur
  useEffect(() => {
    if (!catOpen) return;
    const fn = e => { if (!catRef.current?.contains(e.target)) setCatOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [catOpen]);

  // Échap : referme d'abord le picker catégorie s'il est ouvert, sinon le
  // modal — sans rien soumettre, comme un clic sur le fond de l'overlay.
  useEscapeKey(true, () => (catOpen ? setCatOpen(false) : onClose()));

  // Auto-catégorise quand le libellé change
  const handleLblChange = val => {
    setLbl(val);
    if (isExpense && val.length > 3) {
      const suggested = autoCat(val, -1);
      if (suggested && suggested !== "aut") setCat(suggested);
    }
  };

  const handleTypeChange = expense => {
    setIsExpense(expense);
    setCat(expense ? "aut" : "inc");
    if (!expense) setMode("VIR");
    else setMode("CB");
  };

  const handleSubmit = () => {
    const amtNum = parseFloat(amtStr.replace(",", "."));
    if (!lbl.trim() || isNaN(amtNum) || amtNum <= 0 || !dateVal) return;
    const [y, m, d] = dateVal.split("-");
    const dateObj = new Date(parseInt(y), parseInt(m)-1, parseInt(d));
    const dow = DOW_FR_MODAL[dateObj.getDay()];
    const newTx = {
      id:   Date.now(),
      d:    `${d}/${m}/${y}`,
      dow,
      lbl:  lbl.trim(),
      sub:  sub.trim(),
      acc:  acc.trim() || "CCP",
      cat:  isExpense ? cat : "inc",
      mode,
      amt:  isExpense ? -Math.abs(amtNum) : Math.abs(amtNum),
    };
    onAdd(newTx);
    onClose();
  };

  const canSubmit = lbl.trim() && amtStr && parseFloat(amtStr.replace(",",".")) > 0 && dateVal;
  const selectedCat = catDefs.find(c => c.id === cat);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "var(--overlay-scrim)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onClose}>
      <div className="ambre-modal-box" style={{
        background: "var(--cream-50)", border: "1px solid var(--line)",
        borderRadius: 16, padding: "28px 30px", width: 480,
        display: "flex", flexDirection: "column", gap: 18,
        boxShadow: "0 24px 64px var(--shadow-modal)",
      }} onClick={e => e.stopPropagation()}>

        {/* En-tête */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Ambre · Transactions
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-900)", letterSpacing: "-0.01em", marginTop: 2 }}>
              Saisie <em style={{ color: "var(--amber-500)" }}>manuelle</em>.
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 30, height: 30, borderRadius: 8, border: "1px solid var(--line)",
            background: "transparent", color: "var(--ink-600)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>

        {/* Type dépense / revenu */}
        <div style={{ display: "flex", padding: 3, background: "var(--cream-100)", borderRadius: 9, border: "1px solid var(--line)", gap: 2 }}>
          {[{label:"Dépense", val:true}, {label:"Revenu", val:false}].map(opt => (
            <button key={opt.label} onClick={() => handleTypeChange(opt.val)} style={{
              flex: 1, padding: "6px 0", borderRadius: 7, border: "none", cursor: "pointer",
              background: isExpense === opt.val ? "var(--cream-50)" : "transparent",
              color: isExpense === opt.val ? "var(--ink-900)" : "var(--ink-500)",
              fontWeight: isExpense === opt.val ? 500 : 400, fontSize: 13,
              boxShadow: isExpense === opt.val ? "0 1px 3px var(--shadow-soft)" : "none",
            }}>{opt.label}</button>
          ))}
        </div>

        {/* Date + Montant */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Date</span>
            <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)} style={{
              padding: "9px 12px", background: "var(--cream-100)", border: "1px solid var(--line)",
              borderRadius: 8, fontSize: 13, color: "var(--ink-800)", fontFamily: "inherit", outline: "none",
            }}/>
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Montant (€)</span>
            <input type="number" step="0.01" min="0.01" placeholder="0,00"
                   value={amtStr} onChange={e => setAmtStr(e.target.value)} style={{
              padding: "9px 12px", background: "var(--cream-100)", border: "1px solid var(--line)",
              borderRadius: 8, fontSize: 13, color: "var(--ink-800)", fontFamily: "var(--font-mono)", outline: "none",
            }}/>
          </label>
        </div>

        {/* Libellé */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Libellé</span>
          <input placeholder="ex. Carrefour, Netflix, Loyer…" value={lbl} onChange={e => handleLblChange(e.target.value)}
                 autoFocus style={{
            padding: "9px 12px", background: "var(--cream-100)", border: "1px solid var(--line)",
            borderRadius: 8, fontSize: 13, color: "var(--ink-800)", fontFamily: "inherit", outline: "none",
          }}/>
        </label>

        {/* Sous-titre (optionnel) */}
        <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            Sous-titre <span style={{ fontWeight: 400, opacity: 0.6 }}>· optionnel</span>
          </span>
          <input placeholder="ex. Courses de la semaine" value={sub} onChange={e => setSub(e.target.value)} style={{
            padding: "9px 12px", background: "var(--cream-100)", border: "1px solid var(--line)",
            borderRadius: 8, fontSize: 13, color: "var(--ink-800)", fontFamily: "inherit", outline: "none",
          }}/>
        </label>

        {/* Catégorie (dépenses uniquement) */}
        {isExpense && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, position: "relative" }} ref={catRef}>
            <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Catégorie</span>
            <div onClick={() => setCatOpen(o => !o)} style={{
              padding: "9px 12px", background: "var(--cream-100)", border: "1px solid var(--line)",
              borderRadius: 8, fontSize: 13, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, justifyContent: "space-between",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {selectedCat
                  ? <><span className="amb-dot" style={{ background: selectedCat.color }}/>{selectedCat.label}</>
                  : <span style={{ color: "var(--ink-500)" }}>Choisir…</span>}
              </span>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
            {catOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 20,
                background: "var(--cream-50)", border: "1px solid var(--line)",
                borderRadius: 10, padding: 8, boxShadow: "0 8px 24px var(--shadow-soft)",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
              }}>
                {catDefs.filter(c => c.id !== "inc").map(c => (
                  <div key={c.id} onClick={() => { setCat(c.id); setCatOpen(false); }} style={{
                    padding: "7px 10px", borderRadius: 7, cursor: "pointer", fontSize: 12,
                    background: c.id === cat ? "var(--amber-100)" : "transparent",
                    color: c.id === cat ? "var(--amber-500)" : "var(--ink-800)",
                    display: "flex", alignItems: "center", gap: 7,
                  }}>
                    <span className="amb-dot" style={{ background: c.color }}/>{c.label}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Compte + Mode */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Compte</span>
            <input placeholder="CCP" value={acc} onChange={e => setAcc(e.target.value)} style={{
              padding: "9px 12px", background: "var(--cream-100)", border: "1px solid var(--line)",
              borderRadius: 8, fontSize: 13, color: "var(--ink-800)", fontFamily: "inherit", outline: "none",
            }}/>
          </label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Mode</span>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {MODES_LIST.map(m => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer",
                  border: "1px solid var(--line)", fontFamily: "var(--font-mono)",
                  background: m === mode ? "var(--amber-100)" : "var(--cream-100)",
                  color: m === mode ? "var(--amber-500)" : "var(--ink-600)",
                  fontWeight: m === mode ? 500 : 400,
                }}>{m}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 4, borderTop: "1px solid var(--line)" }}>
          <button onClick={onClose} style={{
            padding: "8px 16px", borderRadius: 8, fontSize: 13, cursor: "pointer",
            border: "1px solid var(--line)", background: "transparent", color: "var(--ink-600)",
          }}>Annuler</button>
          <button onClick={handleSubmit} disabled={!canSubmit} style={{
            padding: "8px 22px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer",
            background: "var(--amber-500)", color: "var(--cream-50)",
            border: "1px solid var(--amber-500)", opacity: canSubmit ? 1 : 0.45,
          }}>Ajouter</button>
        </div>
      </div>
    </div>
  );
}

