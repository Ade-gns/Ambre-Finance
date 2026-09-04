import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fmtEUR } from "../../lib/chartUtils";
import { IcSearch, IcCalendar, IcFilter, IcArrowDn, IcChevDn, IcPlus, IcUpload } from "../../lib/icons";
import { txCatStyle } from "./txHelpers";

/* ─────────────────────────────────────────────────────────────────
   Atomes partagés par les 4 vues
   ───────────────────────────────────────────────────────────────── */
export function TxHeader({ onExport, onAdd }) {
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

export function TxFilterBar({ withChips = true, filter = "all", onChangeFilter = () => {},
                       counts = { all: 18, exp: 16, inc: 1, tr: 1 },
                       search = "", onSearch = () => {},
                       catSel = [], onCatSelChange = () => {},
                       month = "Mai 2026", onMonthChange = () => {},
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

export function TxSummary() {
  return (
    <div className="tx-summary">
      <span style={{ color: "var(--ink-500)" }}>Résumé de la période</span>
    </div>
  );
}

export function TxSummaryReal({ txs = [], month = "" }) {
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

export function TxRow({ t, selected, bulk, dense, onClick, onCheckboxClick, catDefs = [],
                 menuOpen = false, onMenuToggle, onDelete, onRecategorize }) {
  const cat = txCatStyle(t.cat, catDefs);
  const [recatOpen,  setRecatOpen]  = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  useEffect(() => {
    if (!menuOpen) { setRecatOpen(false); setCopied(false); setConfirmDel(false); }
  }, [menuOpen]);

  const handleCopy = e => {
    e.stopPropagation();
    navigator.clipboard.writeText(t.lbl).then(() => {
      setCopied(true);
      setTimeout(() => { setCopied(false); onMenuToggle?.(); }, 900);
    });
  };

  const handleDelete = e => {
    e.stopPropagation();
    if (confirmDel) { onDelete?.(); }
    else { setConfirmDel(true); setTimeout(() => setConfirmDel(false), 2500); }
  };

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
      <div style={{ position: "relative" }}>
        <button className={"tx-menu" + (menuOpen ? " active" : "")}
                onClick={e => { e.stopPropagation(); onMenuToggle?.(); }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
               strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
          </svg>
        </button>
        {menuOpen && onMenuToggle && (
          <div className="tx-ctx-menu" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
            <button className="tx-ctx-item" onClick={e => { e.stopPropagation(); onClick(); onMenuToggle(); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
              Voir le détail
            </button>
            <button className="tx-ctx-item" onClick={handleCopy}>
              {copied
                ? <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sage-500)" strokeWidth="2" strokeLinecap="round"><path d="M20 6L9 17l-5-5"/></svg><span style={{ color: "var(--sage-500)" }}>Copié !</span></>
                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>Copier le libellé</>}
            </button>
            <button className="tx-ctx-item" onClick={e => { e.stopPropagation(); setRecatOpen(o => !o); }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
              Recatégoriser
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ marginLeft: "auto", transform: recatOpen ? "rotate(180deg)" : "none" }}><path d="M6 9l6 6 6-6"/></svg>
            </button>
            {recatOpen && (
              <div className="tx-ctx-cats">
                {catDefs.filter(c => c.id !== "inc").map(c => (
                  <span key={c.id} className={"tx-ctx-cat" + (t.cat === c.id ? " active" : "")}
                        style={{ "--cat-color": c.color }}
                        onClick={e => { e.stopPropagation(); onRecategorize?.(c.id); }}>
                    <span className="amb-dot" style={{ background: c.color }}/>{c.label}
                  </span>
                ))}
              </div>
            )}
            <div className="tx-ctx-sep"/>
            <button className={"tx-ctx-item danger" + (confirmDel ? " confirm" : "")} onClick={handleDelete}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              {confirmDel ? "Confirmer la suppression ?" : "Supprimer"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function TxTableHead({ sortCol = "date", sortDir = "desc", onSort }) {
  const col = (key, label, right) => {
    const active = sortCol === key;
    return (
      <span className={onSort ? ("th-sort" + (active ? " active" : "")) : (key === "date" ? "sort" : "")}
            style={right ? { textAlign: "right" } : undefined}
            onClick={() => onSort?.(key)}>
        {label}
        {onSort && active ? (sortDir === "desc" ? " ↓" : " ↑") : onSort ? <span style={{ opacity: 0.25 }}> ↕</span> : (key === "date" ? <IcArrowDn size={10}/> : null)}
      </span>
    );
  };
  return (
    <div className="tx-thead">
      <span/>
      {col("date", "Date")}
      {col("lbl", "Libellé")}
      {col("acc", "Compte")}
      {col("cat", "Catégorie")}
      {col("mode", "Mode")}
      {col("amt", "Montant", true)}
      <span/>
    </div>
  );
}

