import { useState, useEffect } from "react";
import { useTransactions, useCategories, txMonths, monthKeyLabel } from "../../lib/store";
import { fmtEUR } from "../../lib/chartUtils";
import { IcPlus } from "../../lib/icons";
import { getWeekGroups, exportTxCSV, MONTH_NUM } from "./txHelpers";
import { TxHeader, TxFilterBar, TxSummaryReal, TxRow, TxTableHead } from "./TxAtoms";
import TxAddModal from "./TxAddModal";

/* ─────────────────────────────────────────────────────────────────
   Vue 1 — Liste par défaut
   ───────────────────────────────────────────────────────────────── */

export default function TxDefault({ onRowClick, onSelectMany, autoOpenAdd }) {
  const [allTxs, setAllTxs] = useTransactions();
  const [catDefs] = useCategories();
  const [showAddModal, setShowAddModal] = useState(false);
  useEffect(() => { if (autoOpenAdd) setShowAddModal(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fires once on mount
  const [openMenuId,  setOpenMenuId]   = useState(null);

  const handleAdd = tx => setAllTxs(prev => [tx, ...prev]);

  // Ferme le menu sur clic extérieur ou Escape
  useEffect(() => {
    if (!openMenuId) return;
    const onKey  = e => { if (e.key === "Escape") setOpenMenuId(null); };
    const onDown = ()  => setOpenMenuId(null);
    document.addEventListener("keydown",   onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown",   onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [openMenuId]);

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
  const [sortCol, setSortCol] = useState("date");
  const [sortDir, setSortDir] = useState("desc");

  const handleSort = key => {
    if (key === sortCol) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortCol(key); setSortDir("desc"); }
  };

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
  const filteredTotal = filtered.length;

  const sortedFiltered = [...filtered].sort((a, b) => {
    let va, vb;
    if (sortCol === "date") {
      const pa = (a.d || "").split("/"), pb = (b.d || "").split("/");
      va = pa.length >= 3 ? parseInt(pa[2])*10000 + parseInt(pa[1])*100 + parseInt(pa[0]) : 0;
      vb = pb.length >= 3 ? parseInt(pb[2])*10000 + parseInt(pb[1])*100 + parseInt(pb[0]) : 0;
    } else if (sortCol === "lbl") {
      va = (a.lbl || "").toLowerCase(); vb = (b.lbl || "").toLowerCase();
    } else if (sortCol === "amt") {
      va = a.amt || 0; vb = b.amt || 0;
    } else if (sortCol === "cat") {
      va = (catDefs.find(c => c.id === a.cat)?.label || a.cat || "").toLowerCase();
      vb = (catDefs.find(c => c.id === b.cat)?.label || b.cat || "").toLowerCase();
    } else if (sortCol === "acc") {
      va = (a.acc || "").toLowerCase(); vb = (b.acc || "").toLowerCase();
    } else if (sortCol === "mode") {
      va = (a.mode || "").toLowerCase(); vb = (b.mode || "").toLowerCase();
    }
    const cmp = typeof va === "string" ? va.localeCompare(vb) : (va - vb);
    return sortDir === "desc" ? -cmp : cmp;
  });

  const useGroups = sortCol === "date";
  const groups = useGroups ? getWeekGroups(sortedFiltered) : null;

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
                   monthsOpt={realMonths} catOpt={catDefs}/>
      <TxSummaryReal txs={filtered} month={month} allCount={allTxs.length}/>

      <div className="tx-table">
        <TxTableHead sortCol={sortCol} sortDir={sortDir} onSort={handleSort}/>
        <div className="tx-tbody">
          {useGroups
            ? groups.map((g, _gi) => {
                if (g.txs.length === 0) return null;
                const groupSum = g.txs.reduce((s, t) => s + t.amt, 0);
                return (
                  <div key={g.key}>
                    <div className="tx-group-h">
                      <span>{g.label}</span>
                      <span className="sum">{groupSum > 0 ? "+" : ""}{fmtEUR(groupSum, 2)}</span>
                    </div>
                    {g.txs.map((t, _i) => (
                      <TxRow key={t.id} t={t} catDefs={catDefs} onClick={() => onRowClick(t)}
                             onCheckboxClick={() => onSelectMany(allTxs.findIndex(tx => tx.id === t.id))}
                             menuOpen={openMenuId === t.id}
                             onMenuToggle={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                             onDelete={() => { setAllTxs(prev => prev.filter(tx => String(tx.id) !== String(t.id))); setOpenMenuId(null); }}
                             onRecategorize={catId => { setAllTxs(prev => prev.map(tx => String(tx.id) === String(t.id) ? { ...tx, cat: catId } : tx)); setOpenMenuId(null); }}/>
                    ))}
                  </div>
                );
              })
            : sortedFiltered.map((t, i) => (
                <TxRow key={t.id || i} t={t} catDefs={catDefs} onClick={() => onRowClick(t)}
                       onCheckboxClick={() => onSelectMany(allTxs.findIndex(tx => tx.id === t.id))}
                       menuOpen={openMenuId === t.id}
                       onMenuToggle={() => setOpenMenuId(openMenuId === t.id ? null : t.id)}
                       onDelete={() => { setAllTxs(prev => prev.filter(tx => String(tx.id) !== String(t.id))); setOpenMenuId(null); }}
                       onRecategorize={catId => { setAllTxs(prev => prev.map(tx => String(tx.id) === String(t.id) ? { ...tx, cat: catId } : tx)); setOpenMenuId(null); }}/>
              ))
          }
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

