import { useState, useRef, useEffect } from "react";
import { useTransactions, useCategories, txMonths, monthKeyLabel } from "../../lib/store";
import { fmtEUR } from "../../lib/chartUtils";
import { IcSearch, IcCalendar, IcChevDn, IcTag } from "../../lib/icons";
import { getWeekGroups, exportTxCSV, MONTH_NUM } from "./txHelpers";
import { TxHeader, TxSummaryReal, TxRow, TxTableHead } from "./TxAtoms";

/* ─────────────────────────────────────────────────────────────────
   Vue 4 — Sélection multiple (bulk actions)
   ───────────────────────────────────────────────────────────────── */
export default function TxBulk({ onClose, startIdx }) {
  const [allTxs, setAllTxs] = useTransactions();
  const [catDefs] = useCategories();
  const [selected, setSelected] = useState(() => startIdx != null && startIdx >= 0 ? [startIdx] : []);
  const [recatOpen, setRecatOpen] = useState(false);

  // Filtres
  const realMonths = txMonths(allTxs).map(k => monthKeyLabel(k));
  const [month, setMonth] = useState(() => {
    const sorted = [...allTxs].sort((a, b) => (b.d || "").localeCompare(a.d || ""));
    if (sorted.length > 0 && sorted[0].d) {
      const p = sorted[0].d.split("/");
      if (p.length >= 3) {
        const mNames = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
        const mName = mNames[parseInt(p[1], 10)];
        if (mName) return mName + " " + p[2];
      }
    }
    return realMonths[realMonths.length - 1] || "";
  });
  const [search,    setSearch]    = useState("");
  const [monthOpen, setMonthOpen] = useState(false);
  const monthRef = useRef(null);

  useEffect(() => {
    if (!monthOpen) return;
    const fn = e => { if (!monthRef.current?.contains(e.target)) setMonthOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [monthOpen]);

  // Transactions visibles selon filtres
  const visibleTxs = allTxs.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || (t.lbl || "").toLowerCase().includes(q) || (t.sub || "").toLowerCase().includes(q);
    const mNum  = MONTH_NUM[month?.split(" ")[0]];
    const mYear = month?.split(" ")[1] ? parseInt(month.split(" ")[1], 10) : null;
    const matchMonth = !mNum || (() => {
      const p = (t.d || "").split("/");
      if (p.length < 2) return false;
      const tMonth = parseInt(p[1], 10);
      const tYear  = p.length >= 3 ? parseInt(p[2], 10) : null;
      return tMonth === mNum && (!mYear || !tYear || tYear === mYear);
    })();
    return matchSearch && matchMonth;
  });

  const toggle         = idx => setSelected(prev =>
    prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
  );
  const selectAllVisible = () => setSelected(
    visibleTxs.map(t => allTxs.findIndex(tx => tx.id === t.id)).filter(i => i >= 0)
  );
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
          <span onClick={selectAllVisible}>Tout sélectionner ({visibleTxs.length})</span>
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

      {/* Filtres bulk */}
      <div className="tx-bulk-filters">
        <div ref={monthRef} style={{ position: "relative" }}>
          <button className="tx-btn" onClick={e => { e.stopPropagation(); setMonthOpen(o => !o); }}
                  onMouseDown={e => e.stopPropagation()}>
            <IcCalendar size={13}/>{month || "Tous les mois"}<IcChevDn size={11}/>
          </button>
          {monthOpen && (
            <div className="tx-cat-picker" onClick={e => e.stopPropagation()}
                 onMouseDown={e => e.stopPropagation()}>
              <span onClick={() => { setMonth(""); setMonthOpen(false); }}
                    style={{ fontStyle: "italic", opacity: 0.7 }}>
                Tous les mois
              </span>
              {realMonths.map(m => (
                <span key={m} onClick={() => { setMonth(m); setMonthOpen(false); }}
                      style={{ fontWeight: m === month ? 600 : undefined }}>
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="tx-search" style={{ flex: 1, minWidth: 0 }}>
          <IcSearch size={13}/>
          <input placeholder="Filtrer par libellé…" value={search}
                 onChange={e => setSearch(e.target.value)}/>
          {search && <span className="tx-search-clear" onClick={() => setSearch("")}>×</span>}
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-500)", whiteSpace: "nowrap" }}>
          {visibleTxs.length} transaction{visibleTxs.length !== 1 ? "s" : ""} affichée{visibleTxs.length !== 1 ? "s" : ""}
        </span>
      </div>

      <TxSummaryReal txs={selected.map(i => allTxs[i]).filter(Boolean)} allCount={allTxs.length}/>

      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          {getWeekGroups(visibleTxs).map((g, _gi) => {
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
                {groupWithIdx.map(({ t, idx }, _i) => (
                  <TxRow key={t.id} t={t} catDefs={catDefs}
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

