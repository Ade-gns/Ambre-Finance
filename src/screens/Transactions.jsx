/* Écran Transactions — 4 états gérés via useState
   1. default — table groupée par semaine
   2. detail  — panneau latéral ouvert sur une transaction
   3. empty   — aucun résultat / aucune donnée
   4. bulk    — sélection multiple (bulk actions bar) */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions, useCategories, useAutoRules, applyRules, reapplyRules, parseTxDate, txMonthKey, txMonths, monthKeyLabel, autoCat } from "../lib/store";
import { fmtEUR } from "../lib/chartPrimitives";
import {
  IcSearch, IcCalendar, IcFilter, IcArrowDn, IcChevDn,
  IcPlus, IcTag, IcUpload
} from "../lib/icons";

const MONTHS_SHORT_TX = ["","janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];

function getWeekGroups(txs) {
  const sorted = [...txs].sort((a, b) => {
    const da = parseTxDate(a.d), db = parseTxDate(b.d);
    return (db?.getTime() || 0) - (da?.getTime() || 0);
  });
  const groupMap = {};
  const groupOrder = [];
  sorted.forEach(t => {
    const date = parseTxDate(t.d);
    if (!date) return;
    const monday = new Date(date);
    const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
    monday.setDate(date.getDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    if (!groupMap[key]) {
      const label = `Semaine du ${monday.getDate()} ${MONTHS_SHORT_TX[monday.getMonth() + 1]}`;
      groupMap[key] = { key, label, txs: [] };
      groupOrder.push(key);
    }
    groupMap[key].txs.push(t);
  });
  return groupOrder.map(k => groupMap[k]);
}

function exportTxCSV(txs, filename = "transactions.csv") {
  const header = "Date,Libellé,Sous-titre,Compte,Catégorie,Mode,Montant";
  const rows = txs.map(t =>
    [t.d, `"${t.lbl}"`, `"${t.sub || ""}"`, t.acc, t.cat, t.mode, t.amt].join(",")
  );
  const csv = header + "\n" + rows.join("\n");
  const a   = document.createElement("a");
  a.href    = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function txCatStyle(cat, catDefs = []) {
  if (cat === "inc") return { color: "#6b7a4f", label: "Revenus" };
  if (cat === "epa") return { color: "#7a5c3a", label: "Épargne" };
  const c = catDefs.find(x => x.id === cat);
  return c ? { color: c.color, label: c.label } : { color: "#9d8b73", label: "Autre" };
}

/* ─────────────────────────────────────────────────────────────────
   Composant principal — décide quelle variante afficher
   ───────────────────────────────────────────────────────────────── */
export default function Transactions() {
  const [selectedTx, setSelectedTx] = useState(null);
  const [bulkMode, setBulkMode]     = useState(false);
  const bulkStartRef                = useRef(null);   // index pré-sélectionné à l'entrée

  const openDetail  = tx  => { setSelectedTx(tx); setBulkMode(false); };
  const closeDetail = ()  => setSelectedTx(null);
  const openBulk    = (startIdx = null) => {
    bulkStartRef.current = startIdx;
    setBulkMode(true);
    setSelectedTx(null);
  };
  const closeBulk = () => setBulkMode(false);

  return (
    <>
      <style>{TX_STYLES}</style>

      {bulkMode ? (
        <TxBulk onClose={closeBulk} startIdx={bulkStartRef.current}/>
      ) : selectedTx ? (
        <TxDetail t={selectedTx} onClose={closeDetail}/>
      ) : (
        <TxDefault onRowClick={openDetail} onSelectMany={openBulk}/>
      )}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Modal d'ajout manuel de transaction
   ───────────────────────────────────────────────────────────────── */
const DOW_FR_MODAL = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const MODES_LIST   = ["CB","VIR","PRLV","ESP","CHQ"];

function TxAddModal({ onClose, onAdd }) {
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

/* ─────────────────────────────────────────────────────────────────
   Atomes partagés par les 4 vues
   ───────────────────────────────────────────────────────────────── */
function TxHeader({ onExport, onAdd }) {
  const navigate = useNavigate();
  return (
    <div className="tx-top">
      <div>
        <div className="tx-bread">Ambre · <strong>Transactions</strong></div>
        <h1 className="tx-h1">Mes <em>transactions</em>.</h1>
      </div>
      <div className="tx-h1-actions">
        <button className="tx-btn" onClick={onExport}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
          </svg>
          Exporter
        </button>
        {onAdd && (
          <button className="tx-btn" onClick={onAdd}>
            <IcPlus size={14}/>Ajouter
          </button>
        )}
        <button className="tx-btn amber" onClick={() => navigate("/import")}>
          <IcUpload size={14}/>Importer un relevé
        </button>
      </div>
    </div>
  );
}

function TxFilterBar({ withChips = true, filter = "all", onChangeFilter = () => {},
                       counts = { all: 18, exp: 16, inc: 1, tr: 1 },
                       search = "", onSearch = () => {},
                       catSel = [], onCatSelChange = () => {},
                       month = "Mai 2026", onMonthChange = () => {},
                       sortDir = "desc", onSortDir = () => {},
                       monthsOpt = [], catOpt = [] }) {
  const segs = [
    { key: "all", label: "Tout",       n: counts.all },
    { key: "exp", label: "Dépenses",   n: counts.exp },
    { key: "inc", label: "Revenus",    n: counts.inc },
    { key: "tr",  label: "Transferts", n: counts.tr },
  ];
  const [dateOpen, setDateOpen]     = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const dateRef   = useRef(null);
  const filterRef = useRef(null);
  useEffect(() => {
    if (!dateOpen) return;
    const fn = e => { if (!dateRef.current?.contains(e.target)) setDateOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [dateOpen]);
  useEffect(() => {
    if (!filtersOpen) return;
    const fn = e => { if (!filterRef.current?.contains(e.target)) setFiltersOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [filtersOpen]);
  return (
    <>
      <div className="tx-toolbar">
        <div className="tx-segmented">
          {segs.map(s => (
            <button key={s.key}
                    className={"tx-seg" + (filter === s.key ? " active" : "")}
                    onClick={() => onChangeFilter(s.key)}>
              {s.label} <span className="num">{s.n}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div className="tx-search">
          <IcSearch size={14}/>
          <input placeholder="Rechercher un libellé, un montant…"
                 value={search} onChange={e => onSearch(e.target.value)}
                 autoComplete="off" autoCorrect="off" spellCheck="false"/>
          {search && (
            <span style={{ cursor: "pointer", color: "var(--ink-500)", fontSize: 14, lineHeight: 1 }}
                  onClick={() => onSearch("")}>×</span>
          )}
          {!search && <span className="tx-search-kbd">⌘F</span>}
        </div>
        <div ref={dateRef} style={{ position: "relative" }}>
          <button className="tx-btn" onClick={() => setDateOpen(o => !o)}>
            <IcCalendar size={14}/>{month} <IcChevDn size={12}/>
          </button>
          {dateOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
              background: "var(--cream-50)", border: "1px solid var(--line)",
              borderRadius: 10, boxShadow: "0 8px 24px var(--shadow-soft)",
              minWidth: 180, overflow: "hidden",
            }}>
              {monthsOpt.map(m => (
                <button key={m} style={{
                  display: "block", width: "100%", padding: "9px 16px",
                  background: m === month ? "var(--amber-100)" : "none",
                  color: m === month ? "var(--amber-500)" : "var(--ink-800)",
                  border: "none", cursor: "pointer", fontSize: 13, textAlign: "left",
                  borderBottom: "1px solid var(--line)",
                }} onClick={() => { onMonthChange(m); setDateOpen(false); }}>{m}</button>
              ))}
            </div>
          )}
        </div>
        <div ref={filterRef} style={{ position: "relative" }}>
          <button className="tx-btn" onClick={() => setFiltersOpen(o => !o)}>
            <IcFilter size={14}/>Filtres
            {catSel.length > 0 && <span className="tx-badge">{catSel.length}</span>}
          </button>
          {filtersOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
              background: "var(--cream-50)", border: "1px solid var(--line)",
              borderRadius: 10, boxShadow: "0 8px 24px var(--shadow-soft)",
              width: 230, padding: "14px 16px",
            }}>
              <div style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em",
                            textTransform: "uppercase", marginBottom: 10 }}>Catégories</div>
              {catOpt.map(c => (
                <label key={c.id} style={{ display: "flex", alignItems: "center", gap: 10,
                                            padding: "6px 0", cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={catSel.includes(c.id)}
                         onChange={() => onCatSelChange(catSel.includes(c.id) ? catSel.filter(x => x !== c.id) : [...catSel, c.id])}/>
                  <span className="amb-dot" style={{ background: c.color }}/>
                  {c.label}
                </label>
              ))}
              <div style={{ display: "flex", gap: 6, marginTop: 12, borderTop: "1px solid var(--line)", paddingTop: 10 }}>
                <button className="tx-btn" style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => onCatSelChange([])}>Réinitialiser</button>
                <button className="tx-btn amber" style={{ flex: 1, justifyContent: "center",
                        background: "var(--amber-500)", color: "var(--cream-50)", borderColor: "var(--amber-500)" }}
                        onClick={() => setFiltersOpen(false)}>Appliquer</button>
              </div>
            </div>
          )}
        </div>
        <button className="tx-btn" onClick={() => onSortDir(sortDir === "desc" ? "asc" : "desc")}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h13M3 12h9M3 18h5M14 10l3 3-3 3M17 13H21"/>
          </svg>
          Date {sortDir === "desc" ? "↓" : "↑"}
        </button>
      </div>

      {withChips && (catSel.length > 0 || search) && (
        <div className="tx-chips">
          <span className="tx-chip-lbl">Filtres actifs</span>
          {catSel.map(id => {
            const cat = catOpt.find(c => c.id === id);
            if (!cat) return null;
            return (
              <span key={id} className="tx-chip" style={{ borderColor: cat.color + "55", color: cat.color }}>
                <span className="amb-dot" style={{ background: cat.color }}/>
                {cat.label}
                <span style={{ cursor: "pointer", display: "flex" }}
                      onClick={() => onCatSelChange(catSel.filter(x => x !== id))}>
                  <IcPlus size={11} style={{ transform: "rotate(45deg)" }}/>
                </span>
              </span>
            );
          })}
          {search && (
            <span className="tx-chip">
              <IcSearch size={11}/>
              « {search} »
              <span style={{ cursor: "pointer", display: "flex" }} onClick={() => onSearch("")}>
                <IcPlus size={11} style={{ transform: "rotate(45deg)" }}/>
              </span>
            </span>
          )}
          <button className="tx-chip clear" onClick={() => { onCatSelChange([]); onChangeFilter("all"); onSearch(""); }}>Tout effacer</button>
        </div>
      )}
    </>
  );
}

function TxSummary() {
  return (
    <div className="tx-summary">
      <span style={{ color: "var(--ink-500)" }}>Résumé de la période</span>
    </div>
  );
}

function TxSummaryReal({ txs = [], month = "", allCount = 0 }) {
  const debit  = txs.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0);
  const credit = txs.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);
  const expTxs = txs.filter(t => t.amt < 0);
  const avg = expTxs.length > 0 ? Math.abs(debit) / expTxs.length : 0;
  return (
    <div className="tx-summary">
      <span><strong>{txs.length} transactions</strong>{month ? " · " + month : ""}</span>
      {debit !== 0 && <span>Débit · <strong className="mono" style={{ color: "var(--rose-500)" }}>{fmtEUR(debit, 2)}</strong></span>}
      {credit !== 0 && <span>Crédit · <strong className="mono" style={{ color: "var(--sage-500)" }}>+{fmtEUR(credit, 2)}</strong></span>}
      {avg > 0 && <span>Moyenne · <strong className="mono">{fmtEUR(avg, 0)}</strong></span>}
    </div>
  );
}

function TxRow({ t, selected, bulk, dense, onClick, onCheckboxClick, catDefs = [] }) {
  const cat = txCatStyle(t.cat, catDefs);
  return (
    <div className={"tx-row" +
                    (selected ? " selected" : "") +
                    (bulk ? " bulk" : "") +
                    (dense ? " dense" : "")}
         onClick={onClick}>
      <span className="tx-cb"
            onClick={onCheckboxClick ? e => { e.stopPropagation(); onCheckboxClick(); } : undefined}/>
      <div className="tx-date">
        <span className="dow">{t.dow}</span>
        <span className="num">{t.d}</span>
      </div>
      <div className="tx-label-cell">
        <div className="lbl">{t.lbl}</div>
        <div className="sub">
          {t.sub}
          {t.tags && t.tags.map(tg => (
            <span key={tg} className="tx-tag">↻ {tg}</span>
          ))}
        </div>
      </div>
      <span className="tx-acc">{t.acc}</span>
      <span className="tx-cat-chip" style={{ borderColor: cat.color + "55", color: cat.color }}>
        <span className="amb-dot" style={{ background: cat.color }}/>
        {cat.label}
      </span>
      <span className="tx-mode">{t.mode}</span>
      <span className={"tx-amt" + (t.amt > 0 ? " pos" : "")}>
        {t.amt > 0 ? "+" : ""}{fmtEUR(t.amt, 2)}
      </span>
      <button className="tx-menu" onClick={(e) => e.stopPropagation()}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
             strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </button>
    </div>
  );
}

function TxTableHead() {
  return (
    <div className="tx-thead">
      <span/>
      <span className="sort">Date <IcArrowDn size={10}/></span>
      <span>Libellé</span>
      <span>Compte</span>
      <span>Catégorie</span>
      <span>Mode</span>
      <span style={{ textAlign: "right" }}>Montant</span>
      <span/>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 1 — Liste par défaut
   ───────────────────────────────────────────────────────────────── */
const MONTH_NUM = { "Janvier":1,"Février":2,"Mars":3,"Avril":4,"Mai":5,"Juin":6,"Juillet":7,"Août":8,"Septembre":9,"Octobre":10,"Novembre":11,"Décembre":12 };

function TxDefault({ onRowClick, onSelectMany }) {
  const [allTxs, setAllTxs] = useTransactions();
  const [catDefs] = useCategories();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAdd = tx => setAllTxs(prev => [tx, ...prev]);
  const realMonths = txMonths(allTxs).map(k => monthKeyLabel(k));
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [catSel, setCatSel] = useState([]);
  const [month, setMonth]   = useState(() => {
    // Default to the latest month available
    const sorted = [...allTxs].sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    if (sorted.length > 0 && sorted[0].d) {
      const p = sorted[0].d.split("/");
      if (p.length >= 3) {
        const mNames = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
        const mName = mNames[parseInt(p[1], 10)];
        if (mName) return mName + " " + p[2];
      }
    }
    return "Mai 2026";
  });
  const [sortDir, setSortDir] = useState("desc");

  const cExp = allTxs.filter(t => t.amt < 0 && t.cat !== "epa").length;
  const cInc = allTxs.filter(t => t.amt > 0).length;
  const cTr  = allTxs.filter(t => t.cat === "epa").length;
  const counts = { all: allTxs.length, exp: cExp, inc: cInc, tr: cTr };

  const matchFilter = t => {
    const q = search.toLowerCase();
    const matchSeg = filter === "all" ? true
      : filter === "exp" ? t.amt < 0 && t.cat !== "epa"
      : filter === "inc" ? t.amt > 0
      : t.cat === "epa";
    const matchSearch = !q || (t.lbl || "").toLowerCase().includes(q) || (t.sub || "").toLowerCase().includes(q);
    const matchCat = catSel.length === 0 || catSel.includes(t.cat);
    const mNum = MONTH_NUM[month?.split(" ")[0]];
    const mYear = month?.split(" ")[1] ? parseInt(month.split(" ")[1], 10) : null;
    const matchMonth = !mNum || (() => {
      const p = (t.d || "").split("/");
      if (p.length < 2) return false;
      const tMonth = parseInt(p[1], 10);
      const tYear  = p.length >= 3 ? parseInt(p[2], 10) : null;
      return tMonth === mNum && (!mYear || !tYear || tYear === mYear);
    })();
    return matchSeg && matchSearch && matchCat && matchMonth;
  };

  const filtered = allTxs.filter(matchFilter);
  const groups = getWeekGroups(filtered);
  const sortedGroups = sortDir === "desc" ? groups : [...groups].reverse();
  const filteredTotal = filtered.length;

  return (
    <main className="tx-main">
      {showAddModal && <TxAddModal onClose={() => setShowAddModal(false)} onAdd={handleAdd}/>}
      <TxHeader onExport={() => {
        const filename = `transactions-${month.replace(" ", "-").toLowerCase()}.csv`;
        exportTxCSV(filtered, filtered.length < allTxs.length ? filename : "transactions.csv");
      }} onAdd={() => setShowAddModal(true)}/>
      <TxFilterBar filter={filter} onChangeFilter={setFilter} counts={counts}
                   search={search} onSearch={setSearch}
                   catSel={catSel} onCatSelChange={setCatSel}
                   month={month} onMonthChange={setMonth}
                   sortDir={sortDir} onSortDir={setSortDir}
                   monthsOpt={realMonths} catOpt={catDefs}/>
      <TxSummaryReal txs={filtered} month={month} allCount={allTxs.length}/>

      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          {sortedGroups.map((g, gi) => {
            if (g.txs.length === 0) return null;
            const groupSum = g.txs.reduce((s, t) => s + t.amt, 0);
            return (
              <div key={g.key}>
                <div className="tx-group-h">
                  <span>{g.label}</span>
                  <span className="sum">{groupSum > 0 ? "+" : ""}{fmtEUR(groupSum, 2)}</span>
                </div>
                {g.txs.map((t, i) => (
                  <TxRow key={gi + "-" + i} t={t} catDefs={catDefs} onClick={() => onRowClick(t)}
                         onCheckboxClick={() => onSelectMany(allTxs.findIndex(tx => tx.id === t.id))}/>
                ))}
              </div>
            );
          })}
          {filteredTotal === 0 && (
            <div style={{ padding: "40px 24px", textAlign: "center",
                          color: "var(--ink-500)", fontSize: 13,
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              {search
                ? <>Aucune transaction ne correspond à « {search} ».
                    <span style={{ color: "var(--amber-500)", cursor: "pointer", marginLeft: 8 }}
                          onClick={() => setSearch("")}>Effacer</span></>
                : <>
                    <span>Aucune transaction pour ce mois.</span>
                    <button className="tx-btn" onClick={() => setShowAddModal(true)}
                            style={{ fontSize: 12 }}>
                      <IcPlus size={13}/>Ajouter manuellement
                    </button>
                  </>}
            </div>
          )}
        </div>
        <div className="tx-pagination">
          <span>Affichées <strong>{filteredTotal}</strong> sur {allTxs.length} · <strong>page 1 sur 1</strong></span>
          <div className="tx-pager">
            <button className="tx-btn" disabled>←</button>
            <button className="tx-btn active">1</button>
            <button className="tx-btn" disabled>→</button>
          </div>
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="tx-btn ghost" onClick={() => onSelectMany()} style={{ fontSize: 11 }}>
              Sélectionner plusieurs
            </button>
            <span>Voir : <strong>50 par page</strong></span>
          </span>
        </div>
      </div>
    </main>
  );
}

/* Sous-composant pour la liste dans TxDetail (nécessaire pour les hooks) */
function TxDetailList({ tSel, catDefs }) {
  const [allTxs] = useTransactions();
  const groups = getWeekGroups(allTxs.slice(0, 20)).slice(0, 2);
  return (
    <main className="tx-main with-panel">
      <TxHeader />
      <TxFilterBar />
      <TxSummary />
      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          {groups.map((g, gi) => {
            const groupSum = g.txs.reduce((s, t) => s + t.amt, 0);
            return (
              <div key={g.key}>
                <div className="tx-group-h">
                  <span>{g.label}</span>
                  <span className="sum">{groupSum > 0 ? "+" : ""}{fmtEUR(groupSum, 2)}</span>
                </div>
                {g.txs.slice(0, gi === 0 ? 5 : 6).map((t, i) => (
                  <TxRow key={gi + "-" + i} t={t} catDefs={catDefs}
                         selected={tSel === t} dense={gi > 0}/>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 2 — Liste + panneau de détail
   ───────────────────────────────────────────────────────────────── */
function TxDetail({ t: tSel, onClose }) {
  const [catDefs] = useCategories();
  const [allTxs, setAllTxs] = useTransactions();
  const [autoRules, setAutoRules] = useAutoRules();
  const [catId, setCatId]             = useState(tSel.cat);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(false);
  const [ruleCreated, setRuleCreated] = useState(false);
  const [showRulePrompt, setShowRulePrompt] = useState(false);
  const catSel = txCatStyle(catId, catDefs);
  const allCats = catDefs;

  const norm = s => (s || "").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

  // Mots génériques bancaires à ignorer pour trouver le nom du marchand
  const SKIP = new Set([
    "prlv","prelevement","virement","sepa","carte","retrait","dab","achat",
    "paiement","pmt","chq","cheque","avoir","frais","comm","facture","fact",
    "remboursement","remb","vir","virt","str","tpe","int","prel","men",
    "mensuel","mensuelle","debit","credit","vente","achat","ref","bon",
  ]);

  const simLbl = (() => {
    const words = norm(tSel.lbl).split(" ").filter(w => w.length > 2 && !SKIP.has(w));
    return words.find(w => w.length > 3) || words[0] || "";
  })();

  const similarTxs = allTxs
    .filter(t => {
      if (String(t.id) === String(tSel.id)) return false;
      return simLbl && norm(t.lbl).includes(simLbl);
    })
    .sort((a, b) => { const da = parseTxDate(a.d), db = parseTxDate(b.d); return (db?.getTime() || 0) - (da?.getTime() || 0); })
    .slice(0, 4);

  const handleCreateRule = () => {
    if (!simLbl || ruleCreated) return;
    const newRule = { id: Date.now(), pattern: simLbl, catId, matchType: "contains", active: true, createdAt: new Date().toISOString() };
    // Nouvelle règle EN PREMIER → priorité max sur les anciennes
    setAutoRules([newRule, ...autoRules]);
    // Applique UNIQUEMENT cette règle (évite qu'une ancienne règle conflictuelle écrase)
    setAllTxs(prev => prev.map(t => {
      const cat = applyRules([newRule], t.lbl);
      return cat ? { ...t, cat } : t;
    }));
    setRuleCreated(true);
  };

  return (
    <div className="tx-panel-layout">
      <TxDetailList tSel={tSel} catDefs={catDefs}/>

      <aside className="tx-detail">
        <button className="tx-detail-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>

        <div>
          <div className="tx-detail-h">Détail · {tSel.d} · {tSel.dow}</div>
          <div className="tx-detail-amt" style={{ color: tSel.amt > 0 ? "var(--sage-500)" : "var(--rose-500)" }}>
            <span className="cur">{tSel.amt > 0 ? "+€" : "−€"}</span>
            {Math.abs(Math.floor(tSel.amt)).toLocaleString("fr-FR")}
            <span className="cents">,{String(Math.abs(tSel.amt).toFixed(2)).split(".")[1]}</span>
          </div>
          <div className="tx-detail-lbl">{tSel.lbl}</div>
          <div className="tx-detail-sub">{tSel.sub}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
          <div className="tx-field editable" onClick={() => setCatPickerOpen(v => !v)}>
            <span className="lbl">Catégorie</span>
            <span className="val" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="amb-dot" style={{ background: catSel.color }}/>
              {catSel.label}
              <IcChevDn size={12}/>
            </span>
          </div>
          {catPickerOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
                          background: "var(--cream-50)", border: "1px solid var(--amber-500)",
                          borderRadius: 10, padding: 6, boxShadow: "0 4px 14px var(--shadow-soft)" }}>
              {allCats.map(c => (
                <div key={c.id} onClick={() => {
                  const changed = c.id !== catId;
                  setCatId(c.id);
                  setAllTxs(prev => prev.map(t => String(t.id) === String(tSel.id) ? { ...t, cat: c.id } : t));
                  setCatPickerOpen(false);
                  setRuleCreated(false);
                  setShowRulePrompt(changed && similarTxs.length > 0 && !!simLbl);
                }}
                     style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                              borderRadius: 7, cursor: "pointer", fontSize: 12,
                              background: c.id === catId ? "var(--amber-100)" : "transparent",
                              color: c.id === catId ? "var(--amber-500)" : "var(--ink-800)" }}>
                  <span className="amb-dot" style={{ background: c.color }}/>
                  {c.label}
                </div>
              ))}
            </div>
          )}
          <div className="tx-field">
            <span className="lbl">Compte</span>
            <span className="val">{tSel.acc}</span>
          </div>
          <div className="tx-field">
            <span className="lbl">Mode</span>
            <span className="val">{tSel.mode}</span>
          </div>
          <div className="tx-field">
            <span className="lbl">Référence</span>
            <span className="val mono" style={{ fontSize: 11 }}>FR76 3000 4001 …7849</span>
          </div>
        </div>

        {showRulePrompt && !ruleCreated && (
          <div style={{ background: "var(--amber-100)", border: "1px solid var(--amber-500)",
                        borderRadius: 10, padding: "12px 14px", display: "flex",
                        flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-800)", fontWeight: 500 }}>
              {similarTxs.length} opération{similarTxs.length > 1 ? "s" : ""} similaire{similarTxs.length > 1 ? "s" : ""} trouvée{similarTxs.length > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-600)" }}>
              Créer une règle pour classer automatiquement « {simLbl} » dans cette catégorie ?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="tx-btn amber" style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => { handleCreateRule(); setShowRulePrompt(false); }}>
                Oui, créer la règle
              </button>
              <button className="tx-btn ghost" style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => setShowRulePrompt(false)}>
                Non merci
              </button>
            </div>
          </div>
        )}
        {ruleCreated && (
          <div style={{ background: "var(--cream-100)", border: "1px solid var(--line)",
                        borderRadius: 10, padding: "10px 14px", fontSize: 11,
                        color: "var(--ink-600)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sage-500)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Règle « {simLbl} » créée — les prochaines transactions seront classées automatiquement.
          </div>
        )}

        <div className="tx-detail-section">
          <div className="tx-detail-section-t">Notes & étiquettes</div>
          <div className="tx-notes">
            <em style={{ color: "var(--ink-500)" }}>Courses de la semaine — légumes, fromage, vin.</em>
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <span className="tx-chip" style={{ fontSize: 10 }}>
              <span className="amb-dot" style={{ background: "var(--amber-500)" }}/>récurrent
            </span>
            <span className="tx-chip" style={{ fontSize: 10 }}>épicerie</span>
            <button className="tx-chip" style={{ fontSize: 10, color: "var(--ink-500)" }}>
              <IcPlus size={10}/> Étiquette
            </button>
          </div>
        </div>

        {similarTxs.length > 0 && (
        <div className="tx-detail-section">
          <div className="tx-detail-section-t">
            Transactions similaires <span style={{ color: "var(--amber-500)" }}>· {similarTxs.length}</span>
          </div>
          <div className="tx-similar">
            {similarTxs.map((s, i) => (
              <div key={i} className="tx-similar-row">
                <span className="date">{s.d?.slice(0, 5) || s.d}</span>
                <span style={{ color: "var(--ink-800)" }}>{s.lbl}</span>
                <span className="amt">{fmtEUR(s.amt, 2)}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        <div className="tx-rule">
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--cream-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--amber-500)", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="tx-rule-t">
              {ruleCreated
                ? `Règle « ${simLbl} » créée ✓`
                : `Classer « ${simLbl || tSel.lbl.slice(0, 20)} » en ${catSel.label} ?`}
            </div>
            <div className="tx-rule-s">
              {similarTxs.length > 0
                ? `${similarTxs.length} transaction${similarTxs.length > 1 ? "s" : ""} similaire${similarTxs.length > 1 ? "s" : ""} détectée${similarTxs.length > 1 ? "s" : ""}.`
                : "Aucune transaction similaire pour l'instant."}
            </div>
            {!ruleCreated && simLbl && (
              <button className="tx-btn amber tx-rule-cta" style={{ padding: "5px 10px", fontSize: 11 }}
                      onClick={handleCreateRule}>
                Créer la règle
              </button>
            )}
          </div>
        </div>

        <div className="tx-detail-section" style={{ flexDirection: "row", gap: 8 }}>
          <button className="tx-btn ghost" style={{ fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Scinder
          </button>
          <button className="tx-btn ghost" style={{ fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11h6M9 15h4"/><path d="M5 7l7-5 7 5v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/>
            </svg>
            Dupliquer
          </button>
          <span style={{ flex: 1 }}/>
          <button className="tx-danger-btn"
                  onClick={() => {
                    if (deleteState) {
                      setAllTxs(prev => prev.filter(t => String(t.id) !== String(tSel.id)));
                      onClose();
                    } else {
                      setDeleteState(true);
                      setTimeout(() => setDeleteState(false), 3000);
                    }
                  }}
                  style={{ borderColor: deleteState ? "var(--rose-500)" : undefined,
                           background: deleteState ? "rgba(168,90,72,0.08)" : undefined }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            {deleteState ? "Confirmer la suppression ?" : "Supprimer"}
          </button>
        </div>
      </aside>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 3 — État vide (aucune transaction sur la période)
   ───────────────────────────────────────────────────────────────── */
function TxEmpty() {
  return (
    <main className="tx-main">
      <TxHeader />
      <TxFilterBar withChips={true} />

      <div className="tx-summary">
        <span><strong>0 transaction</strong> · juin 2026</span>
        <span style={{ color: "var(--ink-500)" }}>aucun résultat pour les filtres actifs</span>
        <span style={{ marginLeft: "auto", color: "var(--ink-500)" }}>Dernière sync · il y a 2 min</span>
      </div>

      <div className="tx-empty-card">
        <TxTableHead />
        <div className="tx-empty-body">
          <div className="tx-empty-ico">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.3-4.3"/>
              <path d="M8 11h6" opacity="0.4"/>
            </svg>
          </div>
          <div className="tx-empty-t">
            Aucune transaction <em>ne correspond</em>.
          </div>
          <div className="tx-empty-s">
            Juin 2026 n'a encore aucun mouvement enregistré. Vous pouvez ajuster les filtres,
            changer de période, ou importer le prochain relevé.
          </div>
          <div className="tx-empty-suggest">
            <span style={{
              fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.1em",
              textTransform: "uppercase", alignSelf: "center", marginRight: 4
            }}>Suggestions</span>
            <button className="tx-empty-chip amber">← Revenir à mai 2026</button>
            <button className="tx-empty-chip">Tout effacer les filtres</button>
            <button className="tx-empty-chip">Voir tout depuis le début</button>
            <button className="tx-empty-chip">Période personnalisée</button>
          </div>
          <div className="tx-empty-actions">
            <button className="tx-btn amber" style={{ padding: "9px 16px", fontSize: 13 }}>
              <IcUpload size={14}/>Importer un relevé pour juin
            </button>
            <button className="tx-btn" style={{ padding: "9px 16px", fontSize: 13 }}>
              <IcPlus size={14}/>Ajouter manuellement
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 4 — Sélection multiple (bulk actions)
   ───────────────────────────────────────────────────────────────── */
function TxBulk({ onClose, startIdx }) {
  const [allTxs, setAllTxs] = useTransactions();
  const [catDefs] = useCategories();
  const [selected, setSelected] = useState(() => startIdx != null && startIdx >= 0 ? [startIdx] : []);
  const [recatOpen, setRecatOpen] = useState(false);

  const toggle     = idx => setSelected(prev =>
    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
  );
  const selectAll   = () => setSelected(allTxs.map((_, i) => i));
  const deselectAll = () => setSelected([]);

  const recategorize = catId => {
    const ids = new Set(selected.map(i => allTxs[i]?.id).filter(Boolean));
    setAllTxs(prev => prev.map(t => ids.has(t.id) ? { ...t, cat: catId } : t));
    setRecatOpen(false);
    deselectAll();
  };

  const deleteSelected = () => {
    const ids = new Set(selected.map(i => allTxs[i]?.id).filter(Boolean));
    setAllTxs(prev => prev.filter(t => !ids.has(t.id)));
    onClose();
  };

  const selCount = selected.length;
  const selTotal = selected.reduce((s, i) => s + Math.abs(allTxs[i]?.amt || 0), 0);

  return (
    <main className="tx-main" onClick={() => setRecatOpen(false)}>
      <TxHeader onExport={() => exportTxCSV(selected.map(i => allTxs[i]).filter(Boolean), "selection.csv")} />

      {/* Bulk action bar (remplace la toolbar) */}
      <div className="tx-bulk-bar">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="tx-cb" style={{ background: "var(--amber-500)", border: "none", position: "relative" }}>
            <span style={{ position: "absolute", left: 3, top: 0, width: 4, height: 8,
                          borderRight: "1.5px solid white", borderBottom: "1.5px solid white",
                          transform: "rotate(45deg)" }}/>
          </span>
          <span className="tx-bulk-count">{selCount}</span>
          <span style={{ fontSize: 12, color: "var(--cream-300)" }}>
            transaction{selCount > 1 ? "s" : ""} sélectionnée{selCount > 1 ? "s" : ""} · {fmtEUR(selTotal, 2)}
          </span>
        </span>
        <span style={{ fontSize: 11, color: "var(--cream-300)", cursor: "pointer" }}>
          <span onClick={selectAll}>Tout sélectionner ({allTxs.length})</span>
          {" · "}
          <span onClick={deselectAll}>Désélectionner</span>
        </span>
        <span className="tx-bulk-sep"/>
        <div style={{ position: "relative" }}>
          <button className="tx-bulk-action amber" disabled={selCount === 0}
                  onClick={e => { e.stopPropagation(); setRecatOpen(o => !o); }}>
            <IcTag size={13}/>Re-catégoriser… <IcChevDn size={11}/>
          </button>
          {recatOpen && (
            <div className="tx-cat-picker" onClick={e => e.stopPropagation()}>
              {catDefs.filter(c => c.id !== "inc").map(c => (
                <span key={c.id} onClick={() => recategorize(c.id)}>
                  <span className="amb-dot" style={{ background: c.color }}/>{c.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <span className="tx-bulk-sep"/>
        <button className="tx-bulk-action"
                disabled={selCount === 0}
                onClick={() => exportTxCSV(selected.map(i => allTxs[i]).filter(Boolean), "selection.csv")}>
          Exporter…
        </button>
        <button className="tx-bulk-action danger" disabled={selCount === 0}
                onClick={deleteSelected}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          </svg>
          Supprimer
        </button>
        <button className="tx-bulk-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>
      </div>

      <TxSummaryReal txs={selected.map(i => allTxs[i]).filter(Boolean)} allCount={allTxs.length}/>

      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          {getWeekGroups(allTxs).map((g, gi) => {
            // Find global indices for this group's transactions
            const groupWithIdx = g.txs.map(t => ({ t, idx: allTxs.findIndex(tx => tx.id === t.id) }));
            const selInGroup = groupWithIdx.filter(({ idx }) => selected.includes(idx)).length;
            return (
              <div key={g.key}>
                <div className="tx-group-h">
                  <span>{g.label}</span>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--amber-500)",
                                fontFamily: "var(--font-mono)" }}>
                    {selInGroup > 0 ? `${selInGroup} sélectionnée${selInGroup > 1 ? "s" : ""}` : ""}
                  </span>
                </div>
                {groupWithIdx.map(({ t, idx }, i) => (
                  <TxRow key={gi + "-" + i} t={t} catDefs={catDefs}
                         bulk={selected.includes(idx)} onClick={() => toggle(idx)}/>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles partagés (en variable string pour injection unique)
   ───────────────────────────────────────────────────────────────── */
const TX_STYLES = `
  .tx-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 12px;
             height: 100%; overflow: hidden;
             background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
  .tx-main.with-panel { padding-right: 0; }
  .tx-top { display: flex; align-items: flex-end; justify-content: space-between; }
  .tx-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .tx-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .tx-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
           color: var(--ink-900); letter-spacing: -0.01em; }
  .tx-h1 em { font-style: italic; color: var(--amber-500); }
  .tx-h1-actions { display: flex; gap: 8px; align-items: center; }

  .tx-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
            color: var(--ink-700); font-size: 12px; cursor: pointer; }
  .tx-btn.amber { background: var(--amber-500); color: var(--cream-50);
                  border-color: var(--amber-500); font-weight: 500; }
  .tx-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }
  .tx-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  .tx-badge { background: var(--amber-500); color: var(--cream-50); font-size: 10px;
              padding: 1px 6px; border-radius: 999px; }

  .tx-toolbar { display: flex; align-items: center; gap: 8px; }
  .tx-segmented { display: flex; padding: 3px; background: var(--cream-50);
                  border: 1px solid var(--line); border-radius: 9px; gap: 2px; }
  .tx-seg { padding: 5px 11px; border-radius: 6px; font-size: 12px; color: var(--ink-600);
            background: transparent; border: none; cursor: pointer;
            display: inline-flex; align-items: center; gap: 6px; }
  .tx-seg.active { background: var(--cream-200); color: var(--ink-800); font-weight: 500; }
  .tx-seg .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }
  .tx-seg.active .num { color: var(--amber-500); }

  .tx-search { display: flex; align-items: center; gap: 8px; background: var(--cream-50);
               border: 1px solid var(--line); border-radius: 8px; padding: 6px 10px; min-width: 280px; }
  .tx-search input { border: none; outline: none; background: transparent; flex: 1;
                     font-family: inherit; font-size: 12px; color: var(--ink-800); }
  .tx-search input::placeholder { color: var(--ink-500); }
  .tx-search-kbd { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500);
                   border: 1px solid var(--line); padding: 1px 5px; border-radius: 4px; }

  .tx-chips { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .tx-chip-lbl { font-size: 10px; color: var(--ink-500); letter-spacing: 0.08em;
                 text-transform: uppercase; margin-right: 4px; }
  .tx-chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 10px;
             border: 1px solid var(--line-strong); border-radius: 999px; font-size: 11px;
             background: var(--cream-50); color: var(--ink-700); }
  .tx-chip.clear { color: var(--rose-500); border-color: transparent;
                   background: transparent; cursor: pointer; }

  .tx-summary { display: flex; align-items: center; gap: 18px; padding: 10px 16px;
                background: var(--cream-50); border: 1px solid var(--line); border-radius: 10px;
                font-size: 12px; color: var(--ink-600); }
  .tx-summary strong { color: var(--ink-800); font-weight: 500; }

  .tx-table { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
              flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
  .tx-tbody { flex: 1; overflow: auto; }
  .tx-thead, .tx-row { display: grid;
                       grid-template-columns: 24px 70px 1.6fr 60px 150px 90px 110px 24px;
                       align-items: center; gap: 14px; padding: 8px 18px; }
  .tx-thead { background: var(--cream-100); border-bottom: 1px solid var(--line);
              font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
              color: var(--ink-500); position: sticky; top: 0; z-index: 1; }
  .tx-thead .sort { display: inline-flex; align-items: center; gap: 4px; color: var(--amber-500); }

  .tx-group-h { padding: 10px 18px 6px; font-size: 10px; letter-spacing: 0.1em;
                text-transform: uppercase; color: var(--ink-500);
                background: var(--cream-50); border-bottom: 1px dashed var(--line);
                display: flex; align-items: center; gap: 10px; }
  .tx-group-h .sum { margin-left: auto; font-family: var(--font-mono);
                     color: var(--ink-700); text-transform: none; letter-spacing: 0; }

  .tx-row { padding: 10px 18px; border-bottom: 1px dashed var(--line);
            position: relative; cursor: pointer; }
  .tx-row.dense { padding: 8px 18px; }
  .tx-row:hover { background: var(--cream-100); }
  .tx-row.selected { background: var(--amber-100); }
  .tx-row.selected::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                              width: 2px; background: var(--amber-500); }
  .tx-row.bulk { background: var(--amber-100); }
  .tx-row.bulk:hover { background: var(--amber-100); }
  .tx-row.bulk::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                          width: 2px; background: var(--amber-500); }
  .tx-row.bulk .tx-cb { background: var(--amber-500); border-color: var(--amber-500);
                         position: relative; }
  .tx-row.bulk .tx-cb::after { content: ""; position: absolute; left: 3px; top: 1px;
                                width: 4px; height: 7px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0;
                                transform: rotate(45deg); }

  .tx-cb { width: 14px; height: 14px; border: 1.5px solid var(--line-strong); border-radius: 3.5px;
           cursor: pointer; flex-shrink: 0; }

  .tx-date { display: flex; flex-direction: column; line-height: 1.1; }
  .tx-date .dow { font-size: 9px; letter-spacing: 0.06em; text-transform: uppercase;
                  color: var(--ink-500); font-family: var(--font-mono); }
  .tx-date .num { font-family: var(--font-mono); font-size: 13px;
                  color: var(--ink-800); font-weight: 500; }

  .tx-label-cell .lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .tx-label-cell .sub { font-size: 11px; color: var(--ink-500); margin-top: 2px;
                        display: flex; align-items: center; gap: 6px; }
  .tx-tag { font-family: var(--font-mono); font-size: 9px; color: var(--amber-500);
            background: var(--amber-100); padding: 1px 6px; border-radius: 999px; }

  .tx-acc { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500);
            background: var(--cream-200); padding: 2px 6px; border-radius: 4px; justify-self: start; }

  .tx-cat-chip { display: inline-flex; align-items: center; gap: 6px; padding: 3px 9px;
                 border: 1px solid; border-radius: 999px;
                 font-size: 11px; background: var(--cream-50); }

  .tx-mode { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }
  .tx-amt { font-family: var(--font-mono); font-size: 13.5px; text-align: right;
            color: var(--ink-800); font-weight: 500; }
  .tx-amt.pos { color: var(--sage-500); }

  .tx-menu { width: 24px; height: 24px; padding: 0; border: none; background: transparent;
             color: var(--ink-500); border-radius: 6px; cursor: pointer; }

  .tx-pagination { display: flex; align-items: center; justify-content: space-between;
                   padding: 10px 18px; border-top: 1px solid var(--line);
                   font-size: 11px; color: var(--ink-500); background: var(--cream-50); }
  .tx-pager { display: flex; gap: 4px; }
  .tx-pager > button { width: 26px; height: 26px; padding: 0; }
  .tx-pager > button.active { background: var(--amber-100); color: var(--amber-500);
                              border-color: rgba(184,105,61,0.3); }

  /* DETAIL PANEL */
  .tx-detail { background: var(--cream-50); border-left: 1px solid var(--line);
               padding: 22px 24px 18px;
               display: flex; flex-direction: column; gap: 18px; overflow: auto; }
  .tx-detail-close { width: 28px; height: 28px; padding: 0; align-self: flex-end;
                     background: transparent; border: 1px solid var(--line); border-radius: 7px;
                     color: var(--ink-600);
                     display: flex; align-items: center; justify-content: center; cursor: pointer; }
  .tx-detail-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .tx-detail-amt { font-family: var(--font-display); font-size: 44px; line-height: 1;
                   color: var(--rose-500); margin: 4px 0 6px; letter-spacing: -0.01em; }
  .tx-detail-amt .cur { font-size: 26px; color: var(--ink-500); vertical-align: top; margin-right: 4px; }
  .tx-detail-amt .cents { font-size: 22px; color: var(--ink-500); }
  .tx-detail-lbl { font-family: var(--font-display); font-size: 22px; color: var(--ink-900);
                   letter-spacing: -0.01em; line-height: 1.2; }
  .tx-detail-sub { font-size: 12px; color: var(--ink-500); margin-top: 4px; font-family: var(--font-mono); }

  .tx-detail-section { display: flex; flex-direction: column; gap: 8px;
                       padding-top: 14px; border-top: 1px solid var(--line); }
  .tx-detail-section-t { font-size: 10px; color: var(--ink-500); letter-spacing: 0.1em;
                         text-transform: uppercase; margin-bottom: 2px; }

  .tx-field { display: flex; align-items: center; justify-content: space-between;
              padding: 8px 12px; background: var(--cream-100);
              border: 1px solid var(--line); border-radius: 8px; }
  .tx-field .lbl { font-size: 11px; color: var(--ink-500); }
  .tx-field .val { font-size: 12.5px; color: var(--ink-800); font-weight: 500; }
  .tx-field.editable { cursor: pointer; }
  .tx-field.editable:hover { border-color: var(--amber-500); }

  .tx-notes { background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px;
              padding: 10px 12px; min-height: 56px; font-size: 12px; color: var(--ink-700); }

  .tx-similar { display: flex; flex-direction: column; gap: 6px; }
  .tx-similar-row { display: grid; grid-template-columns: 50px 1fr 80px;
                    align-items: center; gap: 8px; padding: 6px 0;
                    border-bottom: 1px dashed var(--line); font-size: 12px; }
  .tx-similar-row:last-child { border-bottom: none; }
  .tx-similar-row .date { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
  .tx-similar-row .amt { font-family: var(--font-mono); text-align: right; color: var(--ink-800); }

  .tx-rule { display: flex; gap: 10px; padding: 12px; background: var(--amber-100);
             border: 1px solid rgba(184,105,61,0.25); border-radius: 10px; align-items: flex-start; }
  .tx-rule-t { font-size: 12px; font-weight: 500; color: var(--ink-900); }
  .tx-rule-s { font-size: 11px; color: var(--ink-700); margin-top: 3px; }
  .tx-rule-cta { margin-top: 8px; }

  .tx-danger-btn { font-size: 11px; color: var(--rose-500); background: transparent;
                   border: 1px solid rgba(168,90,72,0.3); padding: 6px 10px; border-radius: 7px;
                   display: inline-flex; align-items: center; gap: 6px; cursor: pointer; }

  /* BULK ACTION BAR */
  .tx-bulk-bar { display: flex; align-items: center; gap: 14px; padding: 10px 18px;
                 background: var(--ink-800); color: var(--cream-50); border-radius: 10px;
                 box-shadow: 0 4px 14px var(--shadow-modal); }
  .tx-bulk-count { font-family: var(--font-display); font-size: 22px; }
  .tx-bulk-sep { width: 1px; height: 24px; background: rgba(232,224,208,0.2); }
  .tx-bulk-action { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                    background: rgba(232,224,208,0.08); color: var(--cream-50);
                    border: 1px solid rgba(232,224,208,0.15); border-radius: 8px;
                    font-size: 12.5px; cursor: pointer; }
  .tx-bulk-action.amber { background: var(--amber-500); border-color: var(--amber-500); font-weight: 500; }
  .tx-bulk-action.danger { color: #d68a76; border-color: rgba(214,138,118,0.3); }
  .tx-bulk-close { margin-left: auto; width: 26px; height: 26px; border-radius: 6px;
                   background: transparent; border: none; color: var(--cream-300);
                   display: flex; align-items: center; justify-content: center; cursor: pointer; }

  .tx-cat-picker { display: flex; gap: 6px; padding: 0 6px; }
  .tx-cat-picker > span { padding: 4px 9px; border-radius: 999px;
                          border: 1px solid rgba(232,224,208,0.15);
                          font-size: 11px; color: var(--cream-50);
                          display: flex; align-items: center; gap: 5px; cursor: pointer; }
  .tx-cat-picker > span.hi { background: rgba(184,105,61,0.30); border-color: var(--amber-500); }

  /* EMPTY STATE */
  .tx-empty-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                   flex: 1; min-height: 0; display: flex; flex-direction: column; }
  .tx-empty-body { flex: 1; display: flex; flex-direction: column; align-items: center;
                   justify-content: center; gap: 14px; padding: 32px; }
  .tx-empty-ico { width: 64px; height: 64px; border-radius: 16px; background: var(--cream-100);
                  color: var(--ink-500);
                  display: flex; align-items: center; justify-content: center; }
  .tx-empty-t { font-family: var(--font-display); font-size: 28px; color: var(--ink-900);
                letter-spacing: -0.01em; line-height: 1.1; text-align: center; max-width: 520px; }
  .tx-empty-t em { font-style: italic; color: var(--amber-500); }
  .tx-empty-s { font-size: 13.5px; color: var(--ink-600); text-align: center;
                max-width: 480px; line-height: 1.5; }
  .tx-empty-suggest { display: flex; gap: 8px; flex-wrap: wrap;
                      justify-content: center; margin-top: 6px; }
  .tx-empty-chip { padding: 6px 12px; background: var(--cream-100); border: 1px solid var(--line);
                   border-radius: 999px; font-size: 12px; color: var(--ink-700); cursor: pointer; }
  .tx-empty-chip.amber { background: var(--amber-100); color: var(--amber-500);
                         border-color: rgba(184,105,61,0.3); }
  .tx-empty-actions { display: flex; gap: 10px; margin-top: 14px; }

  /* ─── Layout panel detail ─── */
  .tx-panel-layout {
    display: grid;
    grid-template-columns: 1fr 360px;
    height: 100%;
    background: var(--page-bg);
  }

  /* ─── Mobile ─── */
  @media (max-width: 768px) {
    .tx-main { padding: 14px 12px; gap: 10px; }
    .tx-top { flex-direction: column; align-items: flex-start; gap: 6px; }
    .tx-h1 { font-size: 22px; }
    .tx-h1-actions { flex-wrap: wrap; gap: 6px; }
    .tx-toolbar { flex-wrap: wrap; gap: 6px; }
    .tx-search { min-width: 0; flex: 1 1 100%; }
    .tx-segmented { overflow-x: auto; max-width: 100%; }
    .tx-summary { flex-wrap: wrap; gap: 8px; padding: 8px 12px; font-size: 11px; }
    .tx-chips { gap: 6px; }
    /* Table : masquer compte, catégorie, mode — garder checkbox/date/libellé/montant/menu */
    .tx-thead, .tx-row {
      grid-template-columns: 24px 82px 1fr 80px 24px;
      padding: 8px 10px;
      gap: 8px;
    }
    .tx-acc, .tx-cat-chip, .tx-mode { display: none !important; }
    .tx-thead > :nth-child(4),
    .tx-thead > :nth-child(5),
    .tx-thead > :nth-child(6) { display: none !important; }
    .tx-pagination { flex-wrap: wrap; gap: 8px; padding: 8px 12px; font-size: 11px; }
    /* Panel détail : overlay plein écran */
    .tx-panel-layout { grid-template-columns: 1fr; }
    .tx-detail {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 60px;
      z-index: 150;
      border-left: none;
      border-top: 1px solid var(--line);
      overflow-y: auto;
    }
    .tx-detail-close {
      position: sticky; top: 0;
      align-self: auto;
      z-index: 1;
      background: var(--cream-50);
    }
    .tx-detail-amt { font-size: 36px; }
    .tx-detail-lbl { font-size: 18px; }
    /* Bulk bar */
    .tx-bulk-bar { flex-wrap: wrap; border-radius: 8px; gap: 8px; }
    .tx-bulk-count { font-size: 18px; }
  }
`;
