/* Écran Catégories — 3 vues gérées via useState
   1. manage — vue principale, liste + édition + règles
   2. detail — vue par catégorie (KPIs, courbe, sous-cats, marchands, transactions)
   3. empty  — catégorie créée mais sans transactions (avec suggestions) */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, TRANSACTIONS } from "../data/mockData";
import { fmtEUR, pathSmooth } from "../lib/chartPrimitives";
import {
  IcSearch, IcCalendar, IcFilter, IcArrowR, IcChevDn,
  IcPlus, IcTag, IcSettings, IcChart, IcWallet
} from "../lib/icons";

const CAT_ICON_LIST = [
  { key: "bag",    el: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8l2-5h14l2 5"/><path d="M3 8v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8"/><circle cx="12" cy="14" r="3"/></svg> },
  { key: "tag",    el: s => <IcTag size={s}/> },
  { key: "wallet", el: s => <IcWallet size={s}/> },
  { key: "cal",    el: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8h12v12H6z"/><path d="M9 3v5M15 3v5"/></svg> },
  { key: "pin",    el: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="9" r="6"/><path d="M9 21l3-5 3 5"/></svg> },
  { key: "home",   el: s => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/></svg> },
  { key: "chart",  el: s => <IcChart size={s}/> },
];

const ALL_CATS = [
  ...CATEGORIES.map(c => ({ ...c })),
  { id: "epa", label: "Épargne",     color: "#9d8b73", amount: 300.00, share: 0.10, desc: "Épargne et placements" },
  { id: "fou", label: "Restaurants", color: "#a85a48", amount: 68.50,  share: 0.04, desc: "Restaurants et snacks" },
  { id: "edu", label: "Éducation",   color: "#7a5c3a", amount: 0,      share: 0,    desc: "Frais de scolarité, livres, cours en ligne, abonnements éducatifs" },
];

export default function Categories() {
  const [view, setView]                   = useState("manage"); // manage | detail | empty
  const [selectedCatId, setSelectedCatId] = useState("alim");

  const selectedCat = ALL_CATS.find(c => c.id === selectedCatId) ?? ALL_CATS[0];

  return (
    <>
      {view === "manage" && (
        <CatManage
          selectedCatId={selectedCatId}
          onSelectCat={id => {
            setSelectedCatId(id);
          }}
          onSeeDetail={() => setView("detail")}
          onSeeEmpty={() => setView("empty")}
        />
      )}
      {view === "detail" && <CatDetail cat={selectedCat} onBack={() => setView("manage")} />}
      {view === "empty"  && <CatEmpty  cat={selectedCat} onBack={() => setView("manage")} />}
    </>
  );
}

function downloadCSV(filename, csvText) {
  const a = document.createElement("a");
  a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csvText);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function exportCatsCSV(cats) {
  const header = "ID,Nom,Couleur,Montant ce mois,Part";
  const rows   = cats.map(c => [c.id, `"${c.label}"`, c.color, c.amount || 0, c.share || 0].join(","));
  downloadCSV("categories.csv", header + "\n" + rows.join("\n"));
}

/* ─────────────────────────────────────────────────────────────────
   Vue 1 — Gestion des catégories (liste + édition + règles)
   ───────────────────────────────────────────────────────────────── */
function CatManage({ selectedCatId, onSelectCat, onSeeDetail, onSeeEmpty }) {
  const [userCats, setUserCats]   = useState([]);
  const [deletedIds, setDeletedIds] = useState(new Set());
  const [newOpen, setNewOpen]     = useState(false);
  const [newName, setNewName]     = useState("");
  const [newColor, setNewColor]   = useState("#b8693d");
  const [ioOpen, setIoOpen]       = useState(false);
  const [exported, setExported]   = useState(false);
  const [sortMode, setSortMode]   = useState("default");
  const [sortOpen, setSortOpen]   = useState(false);
  const [catSearch, setCatSearch] = useState("");
  const [catEdits, setCatEdits]   = useState({});
  const fileInputRef              = useRef(null);
  const sortRef                   = useRef(null);
  const ioRef                     = useRef(null);

  const updateCatProp = (id, prop, val) =>
    setCatEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [prop]: val } }));

  // Rules state
  const [rules, setRules] = useState([
    { id: 1, when: "libellé contient", op: "carrefour",                 to: "alim", auto: 14, last: "14/05", active: true },
    { id: 2, when: "libellé contient", op: "monoprix",                  to: "alim", auto: 8,  last: "07/05", active: true },
    { id: 3, when: "libellé contient", op: "boulangerie OU patisserie", to: "alim", auto: 12, last: "10/05", active: true },
    { id: 4, when: "marchand =",       op: "Auchan Drive",              to: "alim", auto: 6,  last: "05/05", active: true },
    { id: 5, when: "libellé contient", op: "fnac.com",                  to: "loi",  auto: 3,  last: "11/05", active: true },
  ]);
  const [editRuleId, setEditRuleId]   = useState(null);
  const [editDraft, setEditDraft]     = useState({});
  const [ruleFormOpen, setRuleFormOpen] = useState(false);
  const [newWhen, setNewWhen]         = useState("libellé contient");
  const [newOp, setNewOp]             = useState("");

  const toggleRule  = id => setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const deleteRule  = id => setRules(prev => prev.filter(r => r.id !== id));
  const startEditRule = r => { setEditRuleId(r.id); setEditDraft({ when: r.when, op: r.op }); };
  const saveEditRule  = () => { setRules(prev => prev.map(r => r.id === editRuleId ? { ...r, ...editDraft } : r)); setEditRuleId(null); };
  const createRule = () => {
    if (!newOp.trim()) return;
    setRules(prev => [...prev, { id: Date.now(), when: newWhen, op: newOp.trim(), to: selected?.id ?? "alim", auto: 0, last: "—", active: true }]);
    setNewOp(""); setNewWhen("libellé contient"); setRuleFormOpen(false);
  };

  useEffect(() => {
    if (!sortOpen) return;
    const fn = e => { if (!sortRef.current?.contains(e.target)) setSortOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [sortOpen]);

  useEffect(() => {
    if (!ioOpen) return;
    const fn = e => { if (!ioRef.current?.contains(e.target)) setIoOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [ioOpen]);

  const allCats = [...ALL_CATS, ...userCats]
    .filter(c => !deletedIds.has(c.id))
    .map(c => ({ ...c, ...(catEdits[c.id] || {}) }))
    .filter(c => !catSearch || c.label.toLowerCase().includes(catSearch.toLowerCase()))
    .sort((a, b) => {
      if (sortMode === "alpha")  return a.label.localeCompare(b.label, "fr");
      if (sortMode === "amount") return (b.amount || 0) - (a.amount || 0);
      return 0;
    });
  const selected = allCats.find(c => c.id === selectedCatId) ?? allCats[0];

  const deleteCat = id => {
    const next = allCats.find(c => c.id !== id);
    setDeletedIds(prev => new Set([...prev, id]));
    if (next) onSelectCat(next.id);
  };

  const createCat = () => {
    if (!newName.trim()) return;
    const id = "usr_" + Date.now();
    setUserCats(prev => [...prev, { id, label: newName.trim(), color: newColor, amount: 0, share: 0, desc: "" }]);
    onSelectCat(id);
    setNewName("");
    setNewColor("#b8693d");
    setNewOpen(false);
  };

  const catRules = rules.filter(r => r.to === selected.id);

  const colorOptions = ["#b8693d","#cd8459","#a85a48","#3d2817","#6b7a4f","#7a5c3a","#9d8b73","#d4a76a"];

  return (
    <main className="cm-main">
      <style>{CAT_STYLES}</style>

      <div className="cm-top">
        <div>
          <div className="cm-bread">Ambre · <strong>Catégories</strong></div>
          <h1 className="cm-h1">Gérer mes <em>catégories</em>.</h1>
        </div>
        <div className="cm-tool">
          <div ref={ioRef} style={{ position: "relative" }}>
            <button className="cm-btn" onClick={() => { setIoOpen(o => !o); setExported(false); }}>
              Importer / Exporter
              <IcChevDn size={11}/>
            </button>
            {ioOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 50,
                background: "var(--cream-50)", border: "1px solid var(--line)",
                borderRadius: 10, boxShadow: "0 8px 24px var(--shadow-soft)",
                minWidth: 200, overflow: "hidden",
              }}>
                <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }}
                       onChange={() => setIoOpen(false)}/>
                <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                                 padding: "11px 16px", background: "none", border: "none",
                                 cursor: "pointer", fontSize: 13, color: "var(--ink-800)",
                                 borderBottom: "1px solid var(--line)" }}
                        onClick={() => { fileInputRef.current?.click(); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>
                  </svg>
                  Importer depuis CSV
                </button>
                <button style={{ display: "flex", alignItems: "center", gap: 10, width: "100%",
                                 padding: "11px 16px", background: "none", border: "none",
                                 cursor: "pointer", fontSize: 13,
                                 color: exported ? "var(--sage-500)" : "var(--ink-800)" }}
                        onClick={() => { exportCatsCSV(allCats); setExported(true); setTimeout(() => setIoOpen(false), 800); }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
                  </svg>
                  {exported ? "✓ Exporté !" : "Exporter en CSV"}
                </button>
              </div>
            )}
          </div>
          <button className="cm-btn amber" onClick={() => setNewOpen(true)}>
            <IcPlus size={14}/>Nouvelle catégorie
          </button>
        </div>
      </div>

      <div className="cm-body">
        {/* GAUCHE — liste des catégories */}
        <div className="cm-card">
          <div className="cm-card-h">
            <div>
              <div className="cm-card-t">{allCats.length} catégories</div>
              <div className="cm-card-s">glisser pour réordonner · cliquer pour éditer</div>
            </div>
            <div ref={sortRef} style={{ position: "relative" }}>
              <button className="cm-btn" style={{ padding: "4px 8px", fontSize: 11 }}
                      onClick={() => setSortOpen(o => !o)}>
                <IcFilter size={11}/>Trier
              </button>
              {sortOpen && (
                <div style={{
                  position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                  background: "var(--cream-50)", border: "1px solid var(--line)",
                  borderRadius: 10, boxShadow: "0 8px 24px var(--shadow-soft)",
                  minWidth: 170, overflow: "hidden",
                }}>
                  {[
                    { key: "default", label: "Ordre par défaut" },
                    { key: "alpha",   label: "Alphabétique" },
                    { key: "amount",  label: "Par montant ↓" },
                  ].map(opt => (
                    <button key={opt.key} style={{
                      display: "flex", alignItems: "center", gap: 8, width: "100%",
                      padding: "9px 14px",
                      background: sortMode === opt.key ? "var(--amber-100)" : "none",
                      color: sortMode === opt.key ? "var(--amber-500)" : "var(--ink-800)",
                      border: "none", borderBottom: "1px solid var(--line)",
                      cursor: "pointer", fontSize: 12, textAlign: "left",
                    }} onClick={() => { setSortMode(opt.key); setSortOpen(false); }}>
                      {opt.label}
                      {sortMode === opt.key && <span style={{ marginLeft: "auto" }}>✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="cm-search">
            <IcSearch size={13}/>
            <input placeholder="Rechercher une catégorie…"
                   value={catSearch} onChange={e => setCatSearch(e.target.value)}
                   autoComplete="off"/>
            {catSearch && (
              <span style={{ cursor: "pointer", color: "var(--ink-500)", fontSize: 14, lineHeight: 1 }}
                    onClick={() => setCatSearch("")}>×</span>
            )}
          </div>
          <div className="cm-list">
            {allCats.map(c => (
              <div key={c.id}
                   className={"cm-list-row" + (c.id === selected.id ? " active" : "")}
                   onClick={() => onSelectCat(c.id)}>
                <span className="cm-drag">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                    <circle cx="3" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>
                    <circle cx="3" cy="7" r="1.2"/><circle cx="9" cy="7" r="1.2"/>
                    <circle cx="3" cy="11" r="1.2"/><circle cx="9" cy="11" r="1.2"/>
                  </svg>
                </span>
                <div className="cm-list-mark" style={{ background: c.color }}>
                  {(catEdits[c.id]?.iconIdx ?? 0) > 0
                    ? CAT_ICON_LIST[catEdits[c.id].iconIdx].el(13)
                    : c.label[0].toLowerCase()}
                </div>
                <div>
                  <div className="cm-list-name">{c.label}</div>
                  <div className="cm-list-meta">{c.amount > 0 ? "ce mois · " + fmtEUR(c.amount, 0) : "inactive"}</div>
                </div>
                <span className="cm-list-amt">{c.amount > 0 ? Math.round((c.share || 0) * 100) + "%" : "—"}</span>
                <span style={{ color: "var(--ink-500)" }}><IcArrowR size={11}/></span>
              </div>
            ))}
          </div>
        </div>

        {/* DROITE — éditeur de la catégorie sélectionnée */}
        <div className="cm-card">
          <div className="cm-card-h">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: selected.color,
                            color: "var(--cream-50)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18 }}>
                {(catEdits[selected.id]?.iconIdx ?? 0) > 0
                  ? CAT_ICON_LIST[catEdits[selected.id].iconIdx].el(18)
                  : selected.label[0].toLowerCase()}
              </div>
              <div>
                <div className="cm-card-t" style={{ fontSize: 15 }}>{selected.label}</div>
                <div className="cm-card-s">
                  {selected.amount > 0 ? `12 mois · ${fmtEUR(selected.amount * 12, 0)} cumulé` : "catégorie inactive"}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="cm-btn" onClick={() => selected.amount > 0 ? onSeeDetail() : onSeeEmpty()}>
                Voir le détail <IcArrowR size={12}/>
              </button>
              <button className="cm-btn" style={{ color: "var(--rose-500)", borderColor: "rgba(168,90,72,0.3)" }}
                      onClick={() => deleteCat(selected.id)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                Supprimer
              </button>
            </div>
          </div>

          <div className="cm-editor" key={selected.id}>
            {/* Identity */}
            <div>
              <div className="cm-section-h">Identité</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Nom</label>
                  <input className="cm-input" defaultValue={selected.label}/>
                </div>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Description</label>
                  <input className="cm-input" defaultValue={selected.desc || ""}/>
                </div>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Couleur</label>
                  <div className="cm-color-picker">
                    {colorOptions.map(c => (
                      <span key={c} className={"cm-color" + (c === selected.color ? " selected" : "")}
                            style={{ background: c }}
                            onClick={() => updateCatProp(selected.id, 'color', c)}/>
                    ))}
                    <span className="cm-color-custom"><IcPlus size={14}/></span>
                  </div>
                </div>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Icône</label>
                  <div className="cm-icon-grid">
                    {CAT_ICON_LIST.map((it, i) => {
                      const iconIdx = catEdits[selected.id]?.iconIdx ?? 0;
                      return (
                        <div key={i} className={"cm-icon" + (iconIdx === i ? " selected" : "")}
                             onClick={() => updateCatProp(selected.id, 'iconIdx', i)}>
                          {it.el(16)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <div className="cm-section-h">Budget mensuel</div>
              {(() => {
                const budget = catEdits[selected.id]?.budget ?? 500;
                const pct = budget > 0 ? Math.min((selected.amount / budget) * 100, 100) : 0;
                return (
                  <div className="cm-budget">
                    <div className="cm-budget-input">
                      <span className="cur">€</span>
                      <input type="number" min={0} step={10}
                             className="num"
                             value={budget}
                             onChange={e => updateCatProp(selected.id, 'budget', Number(e.target.value))}
                             style={{ border: "none", outline: "none", background: "transparent",
                                      fontFamily: "var(--font-display)", fontSize: 28,
                                      color: "var(--ink-900)", width: 80, lineHeight: 1 }}/>
                    </div>
                    <div className="cm-budget-bar">
                      <div className="fill" style={{ width: `${pct.toFixed(1)}%` }}/>
                      <div className="thumb" style={{ left: `calc(${pct.toFixed(1)}% - 8px)` }}/>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
                      {selected.amount > 0 ? `${fmtEUR(selected.amount, 0)} dépensés · ${Math.round(pct)} %` : "aucune dépense ce mois"}
                    </span>
                  </div>
                );
              })()}
              <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 6 }}>
                Une alerte sera envoyée à 85 % et 100 % · <span style={{ color: "var(--amber-500)", cursor: "pointer" }}>modifier les seuils →</span>
              </div>
            </div>

            {/* Rules */}
            <div>
              <div className="cm-section-h">
                Règles de classement automatique · {catRules.filter(r => r.active).length} actives
              </div>
            </div>
          </div>

          <div className="cm-rules-add">
            <div style={{ flex: 1, fontSize: 12, color: "var(--ink-500)" }}>
              Une transaction sera classée en <strong style={{ color: selected.color }}>{selected.label}</strong> si elle correspond à une des règles ci-dessous.
            </div>
            <button className="cm-btn amber" style={{ padding: "6px 12px", fontSize: 11 }}
                    onClick={() => setRuleFormOpen(true)}>
              <IcPlus size={12}/>Nouvelle règle
            </button>
          </div>

          <div style={{ overflow: "auto" }}>
            {catRules.length === 0 ? (
              <div style={{ padding: "24px 18px", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                Aucune règle configurée pour {selected.label}.
              </div>
            ) : catRules.map(r => (
              <div key={r.id} className="cm-rule">
                <span className={"cm-rule-toggle" + (r.active ? "" : " off")}
                      onClick={() => toggleRule(r.id)}
                      style={{ cursor: "pointer", flexShrink: 0 }}/>
                {editRuleId === r.id ? (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1 }}>
                    <select className="cm-input" style={{ fontSize: 11, padding: "4px 8px" }}
                            value={editDraft.when}
                            onChange={e => setEditDraft(d => ({ ...d, when: e.target.value }))}>
                      <option>libellé contient</option>
                      <option>marchand =</option>
                      <option>montant &gt;</option>
                      <option>montant &lt;</option>
                    </select>
                    <input className="cm-input" style={{ fontSize: 11, padding: "4px 8px", flex: 1 }}
                           value={editDraft.op}
                           onChange={e => setEditDraft(d => ({ ...d, op: e.target.value }))}
                           onKeyDown={e => e.key === "Enter" && saveEditRule()}
                           autoFocus/>
                    <button className="cm-btn amber" style={{ padding: "3px 8px", fontSize: 11 }}
                            onClick={saveEditRule}>✓</button>
                    <button className="cm-btn" style={{ padding: "3px 8px", fontSize: 11 }}
                            onClick={() => setEditRuleId(null)}>✕</button>
                  </div>
                ) : (
                  <div className="cm-rule-body">
                    <div className="cm-rule-cond" style={{ opacity: r.active ? 1 : 0.5 }}>
                      Si {r.when} <strong>« {r.op} »</strong>
                    </div>
                    <div className="cm-rule-meta">
                      → classer en <strong style={{ color: selected.color }}>{selected.label}</strong>
                      {" · dernière correspondance : " + r.last}
                    </div>
                  </div>
                )}
                {editRuleId !== r.id && <span className="cm-rule-count">{r.auto}</span>}
                {editRuleId !== r.id && (
                  <button className="cm-btn" style={{ padding: 0, width: 24, height: 24, justifyContent: "center" }}
                          onClick={() => startEditRule(r)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/>
                    </svg>
                  </button>
                )}
                {editRuleId !== r.id && (
                  <button className="cm-btn" style={{ padding: 0, width: 24, height: 24, justifyContent: "center", color: "var(--rose-500)" }}
                          onClick={() => deleteRule(r.id)}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                         strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal — nouvelle catégorie */}
      {newOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--overlay-scrim)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setNewOpen(false)}>
          <div style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 400,
            boxShadow: "0 24px 60px var(--shadow-modal)",
            display: "flex", flexDirection: "column", gap: 20,
          }} onClick={e => e.stopPropagation()}>
            <div>
              <div style={{ fontSize: 17, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                Nouvelle catégorie
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>
                Vous pourrez ajouter des règles et un budget ensuite.
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Nom</label>
                <input
                  className="cm-input"
                  style={{ width: "100%", boxSizing: "border-box" }}
                  placeholder="ex. Santé, Sport, Voyages…"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && createCat()}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Couleur</label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["#b8693d","#cd8459","#a85a48","#3d2817","#6b7a4f","#7a5c3a","#9d8b73","#d4a76a"].map(c => (
                    <span key={c}
                          onClick={() => setNewColor(c)}
                          style={{
                            width: 30, height: 30, borderRadius: 8, background: c, cursor: "pointer",
                            border: c === newColor ? "2.5px solid var(--ink-900)" : "2px solid transparent",
                          }}/>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="cm-btn" onClick={() => setNewOpen(false)}>Annuler</button>
              <button
                className="cm-btn amber"
                onClick={createCat}
                style={{ opacity: newName.trim() ? 1 : 0.5 }}>
                <IcPlus size={13}/>Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal — nouvelle règle */}
      {ruleFormOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--overlay-scrim)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setRuleFormOpen(false)}>
          <div style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 440,
            boxShadow: "0 24px 60px var(--shadow-modal)",
            display: "flex", flexDirection: "column", gap: 20,
          }} onClick={e => e.stopPropagation()}>
            <div>
              <div style={{ fontSize: 17, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                Nouvelle règle
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>
                Classer automatiquement dans <strong style={{ color: selected?.color }}>{selected?.label}</strong>.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Condition</label>
                <select className="cm-input" style={{ width: "100%", boxSizing: "border-box" }}
                        value={newWhen} onChange={e => setNewWhen(e.target.value)}>
                  <option>libellé contient</option>
                  <option>marchand =</option>
                  <option>montant &gt;</option>
                  <option>montant &lt;</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Valeur</label>
                <input className="cm-input" style={{ width: "100%", boxSizing: "border-box" }}
                       placeholder='ex. "carrefour", "Auchan Drive", "50"…'
                       value={newOp} onChange={e => setNewOp(e.target.value)}
                       onKeyDown={e => e.key === "Enter" && createRule()}
                       autoFocus/>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="cm-btn" onClick={() => setRuleFormOpen(false)}>Annuler</button>
              <button className="cm-btn amber" onClick={createRule}
                      style={{ opacity: newOp.trim() ? 1 : 0.5 }}>
                <IcPlus size={13}/>Créer la règle
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 2 — Détail d'une catégorie (drill-down)
   ───────────────────────────────────────────────────────────────── */
function CatDetail({ cat, onBack }) {
  const navigate = useNavigate();
  const [period, setPeriod]           = useState("12 m");
  const [catMonth, setCatMonth]       = useState("Mai 2026");
  const [catMonthOpen, setCatMonthOpen] = useState(false);
  const catMonthRef                   = useRef(null);
  const MONTHS_OPT = ["Mai 2026","Avril 2026","Mars 2026","Février 2026","Janvier 2026","Décembre 2025","Novembre 2025","Octobre 2025"];
  useEffect(() => {
    if (!catMonthOpen) return;
    const fn = e => { if (!catMonthRef.current?.contains(e.target)) setCatMonthOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [catMonthOpen]);

  const allMonths = ["Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc.","Janv.","Févr.","Mars","Avril","Mai"];
  const allSeries = [412, 488, 502, 470, 425, 460, 612, 478, 442, 466, 462, 487];
  const months = period === "6 m" ? allMonths.slice(6) : period === "YTD" ? allMonths.slice(7) : allMonths;
  const series = period === "6 m" ? allSeries.slice(6) : period === "YTD" ? allSeries.slice(7) : allSeries;

  const subCats = [
    { label: "Supermarchés",  amt: 312.40, share: 0.64, color: "#b8693d" },
    { label: "Boulangerie",   amt:  44.20, share: 0.09, color: "#cd8459" },
    { label: "Restaurants",   amt:  68.50, share: 0.14, color: "#a85a48" },
    { label: "Marchés",       amt:  28.00, share: 0.06, color: "#7a5c3a" },
    { label: "Livraison",     amt:  34.10, share: 0.07, color: "#d4a76a" },
  ];

  const merchants = [
    { name: "Carrefour Market",   n: 6, sum: 184.20 },
    { name: "Auchan Drive",       n: 2, sum: 164.80 },
    { name: "Monoprix",           n: 4, sum:  81.95 },
    { name: "Boulangerie Pichon", n: 5, sum:  41.80 },
    { name: "Le Petit Café",      n: 3, sum:  14.20 },
  ];

  const txInCat = TRANSACTIONS.filter(t => t.cat === cat.id);
  const txDisplay = (txInCat.length > 0 ? txInCat : TRANSACTIONS).slice(0, 8);

  return (
    <main className="cd-main">
      <style>{CAT_STYLES}</style>

      <div className="cd-bread">
        <span className="crumb-link" onClick={onBack}>Catégories</span>
        <IcArrowR size={10}/>
        <strong>{cat.label}</strong>
      </div>

      <div className="cd-header">
        <div className="cd-h-left">
          <div className="cd-mark" style={{ background: cat.color }}>{cat.label[0].toLowerCase()}</div>
          <div>
            <h1 className="cd-h1">{cat.label}</h1>
            <div className="cd-h-desc">{cat.desc || cat.label}</div>
          </div>
        </div>
        <div className="cd-tool">
          <div ref={catMonthRef} style={{ position: "relative" }}>
            <button className="cd-btn" onClick={() => setCatMonthOpen(o => !o)}>
              <IcCalendar size={14}/>{catMonth} <IcChevDn size={12}/>
            </button>
            {catMonthOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                background: "var(--cream-50)", border: "1px solid var(--line)",
                borderRadius: 10, boxShadow: "0 8px 24px var(--shadow-soft)",
                minWidth: 180, overflow: "hidden",
              }}>
                {MONTHS_OPT.map(m => (
                  <button key={m} style={{
                    display: "block", width: "100%", padding: "9px 16px",
                    background: m === catMonth ? "var(--amber-100)" : "none",
                    color: m === catMonth ? "var(--amber-500)" : "var(--ink-800)",
                    border: "none", borderBottom: "1px solid var(--line)",
                    cursor: "pointer", fontSize: 13, textAlign: "left",
                  }} onClick={() => { setCatMonth(m); setCatMonthOpen(false); }}>{m}</button>
                ))}
              </div>
            )}
          </div>
          <button className="cd-btn" onClick={onBack}><IcSettings size={14}/>Modifier la catégorie</button>
        </div>
      </div>

      <div className="cd-kpis">
        <div className="cd-card">
          <div className="cd-card-l">Total ce mois</div>
          <div className="cd-card-v">{fmtEUR(cat.amount || 487, 0)}</div>
          <div className="cd-card-s cd-delta-up">↑ 5,4 % vs avril</div>
        </div>
        <div className="cd-card">
          <div className="cd-card-l">Moyenne 12 mois</div>
          <div className="cd-card-v">{fmtEUR(471, 0)}</div>
          <div className="cd-card-s">soit ~16 €/jour</div>
        </div>
        <div className="cd-card">
          <div className="cd-card-l">Part du budget mensuel</div>
          <div className="cd-card-v">28 %</div>
          <div className="cd-card-s">2e poste après Logement</div>
        </div>
        <div className="cd-card">
          <div className="cd-card-l">Transactions</div>
          <div className="cd-card-v">14</div>
          <div className="cd-card-s">↻ 6 récurrentes détectées</div>
        </div>
      </div>

      {/* Chart */}
      <div className="cd-chart-card">
        <div className="cd-card-h">
          <div>
            <div className="cd-card-t">Évolution sur 12 mois</div>
            <div className="cd-card-ss">moyenne en pointillé · décembre = pic de saison</div>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["12 m", "6 m", "YTD"].map(p => (
              <button key={p} className="cd-btn"
                      style={{ padding: "3px 9px", fontSize: 11,
                               ...(period === p ? { background: "var(--amber-100)", color: "var(--amber-500)", borderColor: "rgba(184,105,61,0.3)" } : {}) }}
                      onClick={() => setPeriod(p)}>
                {p}
              </button>
            ))}
          </div>
        </div>
        <CategoryEvolutionChart months={months} values={series} color={cat.color}/>
      </div>

      {/* Bottom — 3 colonnes */}
      <div className="cd-bot">
        <div className="cd-card cd-bot-card">
          <div className="cd-card-h">
            <div>
              <div className="cd-card-t">Sous-catégories</div>
              <div className="cd-card-ss">détail interne de {cat.label}</div>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {subCats.map(s => (
              <div key={s.label} className="cd-bar-row">
                <div className="cd-bar-meta">
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span className="amb-dot" style={{ background: s.color }}/>
                    {s.label}
                  </span>
                  <span style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                    <span className="pct">{Math.round(s.share * 100)} %</span>
                    <span className="amt">{fmtEUR(s.amt, 0)}</span>
                  </span>
                </div>
                <div className="cd-bar">
                  <div style={{ width: `${s.share * 100}%`, height: "100%",
                                background: s.color, borderRadius: 999 }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="cd-card cd-bot-card">
          <div className="cd-card-h">
            <div>
              <div className="cd-card-t">Marchands principaux</div>
              <div className="cd-card-ss">top 5 sur 12 mois</div>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {merchants.map(m => (
              <div key={m.name} className="cd-merch-row">
                <div className="cd-merch-mark">{m.name[0].toLowerCase()}</div>
                <div>
                  <div className="cd-merch-name">{m.name}</div>
                  <div className="cd-merch-n">{m.n} transactions</div>
                </div>
                <span className="cd-merch-n">↻</span>
                <span className="cd-merch-sum">{fmtEUR(m.sum, 0)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="cd-card cd-bot-card">
          <div className="cd-card-h">
            <div>
              <div className="cd-card-t">Transactions · {cat.label}</div>
              <div className="cd-card-ss">{txDisplay.length} mouvements ce mois</div>
            </div>
            <button className="cd-btn" style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => navigate("/transactions")}>
              Voir tout <IcArrowR size={11}/>
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {txDisplay.map((t, i) => (
              <div key={i} className="cd-tx-row">
                <span className="cd-tx-date">{t.d}</span>
                <div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-800)" }}>{t.label}</div>
                  <div style={{ fontSize: 10, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>{t.mode}</div>
                </div>
                <span className="cd-tx-amt">{fmtEUR(t.amt, 2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* Graphique d'évolution d'une catégorie sur 12 mois */
function CategoryEvolutionChart({ months, values, color }) {
  const width = 1280, height = 160;
  const padX = 36, padR = 18, padY = 18, padB = 22;
  const innerW = width - padX - padR;
  const innerH = height - padY - padB;
  const min = Math.min(...values) * 0.9;
  const max = Math.max(...values) * 1.05;
  const xs = months.map((_, i) => padX + (i * innerW) / (months.length - 1));
  const yOf = v => padY + innerH - ((v - min) / (max - min)) * innerH;
  const pts = xs.map((x, i) => [x, yOf(values[i])]);
  const line = pathSmooth(pts);
  const area = `${line} L ${xs[xs.length - 1]} ${padY + innerH} L ${xs[0]} ${padY + innerH} Z`;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const avgY = yOf(avg);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
         style={{ height: 180 }}>
      <defs>
        <linearGradient id="cdGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => {
        const y = padY + innerH - t * innerH;
        return (
          <g key={i}>
            <line x1={padX} x2={width - padR} y1={y} y2={y} style={{ stroke: "var(--grid-line)" }}/>
            <text x={padX - 6} y={y + 4} textAnchor="end" fontSize="10"
                  fontFamily="var(--font-mono)" style={{ fill: "var(--ink-500)" }}>
              {Math.round(min + t * (max - min))} €
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#cdGrad)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <line x1={padX} x2={width - padR} y1={avgY} y2={avgY}
            stroke="var(--ink-500)" strokeDasharray="3 4"/>
      <text x={width - padR - 4} y={avgY - 4} textAnchor="end" fontSize="10"
            fontFamily="var(--font-mono)" fill="var(--ink-500)">moyenne · {Math.round(avg)} €</text>
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={i === pts.length - 1 ? 4 : 2.5}
                fill={color} stroke="var(--cream-50)" strokeWidth="1.5"/>
      ))}
      {months.map((m, i) => (
        <text key={i} x={xs[i]} y={height - 6} textAnchor="middle" fontSize="10"
              fontFamily="var(--font-ui)" style={{ fill: "var(--ink-500)" }}>{m}</text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 3 — Catégorie vide (créée mais sans transactions)
   ───────────────────────────────────────────────────────────────── */
function CatEmpty({ cat, onBack }) {
  const [emptyMonth, setEmptyMonth]       = useState("Mai 2026");
  const [emptyMonthOpen, setEmptyMonthOpen] = useState(false);
  const emptyMonthRef                     = useRef(null);
  const MONTHS_OPT = ["Mai 2026","Avril 2026","Mars 2026","Février 2026","Janvier 2026","Décembre 2025","Novembre 2025","Octobre 2025"];
  useEffect(() => {
    if (!emptyMonthOpen) return;
    const fn = e => { if (!emptyMonthRef.current?.contains(e.target)) setEmptyMonthOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [emptyMonthOpen]);

  const suggestions = [
    { d: "11/05", lbl: "Udemy.com — Subscription", sub: "PAIEMENT PAR CARTE",  cur: "abo", amt: -16.99 },
    { d: "04/05", lbl: "Fnac.com",                 sub: "Livre · Sapiens",     cur: "loi", amt: -22.50 },
    { d: "28/04", lbl: "Coursera Plus",            sub: "ABONNEMENT MENSUEL",  cur: "abo", amt: -49.00 },
  ];

  return (
    <main className="ce-main">
      <style>{CAT_STYLES + `
        .ce-empty-ico { color: ${cat.color}; }
        .ce-empty-t em { color: ${cat.color}; }
        .ce-empty-actions .primary {
          background: ${cat.color}; color: var(--cream-50);
          border: 1px solid ${cat.color}; font-weight: 500;
        }
        .ce-rule-tip-ico { color: ${cat.color}; }
        .ce-sg-act .primary {
          background: ${cat.color}; color: var(--cream-50); border-color: ${cat.color};
        }
      `}</style>

      <div className="ce-bread">
        <span className="crumb-link" onClick={onBack}>Catégories</span>
        <IcArrowR size={10}/>
        <strong>{cat.label}</strong>
      </div>

      <div className="ce-header">
        <div className="ce-h-left">
          <div className="ce-mark" style={{ background: cat.color }}>{cat.label[0].toLowerCase()}</div>
          <div>
            <h1 className="ce-h1">{cat.label}</h1>
            <div className="ce-h-desc">{cat.desc || cat.label}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div ref={emptyMonthRef} style={{ position: "relative" }}>
            <button className="ce-btn" onClick={() => setEmptyMonthOpen(o => !o)}>
              <IcCalendar size={14}/>{emptyMonth} <IcChevDn size={12}/>
            </button>
            {emptyMonthOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
                background: "var(--cream-50)", border: "1px solid var(--line)",
                borderRadius: 10, boxShadow: "0 8px 24px var(--shadow-soft)",
                minWidth: 180, overflow: "hidden",
              }}>
                {MONTHS_OPT.map(m => (
                  <button key={m} style={{
                    display: "block", width: "100%", padding: "9px 16px",
                    background: m === emptyMonth ? "var(--amber-100)" : "none",
                    color: m === emptyMonth ? "var(--amber-500)" : "var(--ink-800)",
                    border: "none", borderBottom: "1px solid var(--line)",
                    cursor: "pointer", fontSize: 13, textAlign: "left",
                  }} onClick={() => { setEmptyMonth(m); setEmptyMonthOpen(false); }}>{m}</button>
                ))}
              </div>
            )}
          </div>
          <button className="ce-btn" onClick={onBack}><IcSettings size={14}/>Modifier la catégorie</button>
        </div>
      </div>

      {/* KPI ghosts */}
      <div className="ce-kpis">
        <div className="ce-kpi">
          <div className="ce-kpi-l">Total ce mois</div>
          <div className="ce-kpi-v">0 €</div>
          <div className="ce-kpi-s">aucune transaction</div>
        </div>
        <div className="ce-kpi">
          <div className="ce-kpi-l">Moyenne 12 mois</div>
          <div className="ce-kpi-v">— €</div>
          <div className="ce-kpi-s">catégorie inactive</div>
        </div>
        <div className="ce-kpi">
          <div className="ce-kpi-l">Part du budget</div>
          <div className="ce-kpi-v">0 %</div>
          <div className="ce-kpi-s">budget non défini</div>
        </div>
        <div className="ce-kpi">
          <div className="ce-kpi-l">Règles automatiques</div>
          <div className="ce-kpi-v">0</div>
          <div className="ce-kpi-s">aucune règle configurée</div>
        </div>
      </div>

      {/* Hero empty + suggestions */}
      <div className="ce-hero">
        <div className="ce-hero-empty">
          <div className="ce-empty-ico">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 7l10-4 10 4-10 4L2 7z"/>
              <path d="M6 9.5v6c0 1.5 3 3.5 6 3.5s6-2 6-3.5v-6"/>
              <path d="M22 7v6"/>
            </svg>
          </div>
          <div className="ce-empty-t">
            Rien à montrer dans <em>{cat.label}</em>.
          </div>
          <div className="ce-empty-s">
            Cette catégorie existe mais aucune transaction n'y a encore été classée — ni ce mois,
            ni les précédents. Voulez-vous ajouter une transaction manuellement, ou créer une règle
            de classement automatique pour les prochains relevés ?
          </div>
          <div className="ce-empty-actions">
            <button className="primary">
              <IcPlus size={14} style={{ marginRight: 6 }}/>Ajouter une transaction
            </button>
            <button className="ce-btn" style={{ padding: "9px 16px", fontSize: 13 }}>
              <IcTag size={14}/>Créer une règle automatique
            </button>
          </div>
          <div className="ce-trend">
            <span className="ce-trend-l">12 mois ·</span>
            <div className="ce-trend-flat"/>
            <span className="ce-trend-l mono" style={{ fontFamily: "var(--font-mono)" }}>aucune donnée</span>
          </div>
        </div>

        <div className="ce-card">
          <div className="ce-card-h">
            <div>
              <div className="ce-card-t">Suggestions à partir de vos transactions</div>
              <div className="ce-card-s">3 mouvements récents qui pourraient appartenir à {cat.label}</div>
            </div>
            <button className="ce-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Ignorer</button>
          </div>

          <div style={{ overflow: "hidden", flex: 1 }}>
            {suggestions.map((s, i) => (
              <div key={i} className="ce-sg-row">
                <span className="ce-sg-date">{s.d}</span>
                <div>
                  <div className="ce-sg-lbl">{s.lbl}</div>
                  <div className="ce-sg-sub">{s.sub}</div>
                </div>
                <span className="ce-sg-cur">
                  <span className="amb-dot" style={{ background: s.cur === "abo" ? "#cd8459" : "#a85a48" }}/>
                  {s.cur === "abo" ? "Abonnements" : "Loisirs"}
                </span>
                <div className="ce-sg-act">
                  <button className="primary"
                          style={{ padding: "4px 8px", fontSize: 10.5,
                                  borderRadius: 8, border: "none", cursor: "pointer" }}>
                    → {cat.label}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="ce-rule-tip">
            <div className="ce-rule-tip-ico">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
              </svg>
            </div>
            <div>
              <div className="ce-rule-tip-t">Astuce — créer une règle</div>
              <div className="ce-rule-tip-s">
                Créez une règle depuis Catégories → Règles pour classer automatiquement
                les prochaines transactions dans <strong>{cat.label}</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles partagés par les 3 vues
   ───────────────────────────────────────────────────────────────── */
const CAT_STYLES = `
  /* MANAGE VIEW */
  .cm-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px;
             height: 100%; overflow: hidden;
             background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
  .cm-top { display: flex; align-items: flex-end; justify-content: space-between; }
  .cm-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .cm-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .cm-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
           color: var(--ink-900); letter-spacing: -0.01em; }
  .cm-h1 em { font-style: italic; color: var(--amber-500); }
  .cm-tool { display: flex; gap: 8px; align-items: center; }
  .cm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px;
            background: var(--cream-50); color: var(--ink-700);
            font-size: 12px; cursor: pointer; }
  .cm-btn.amber { background: var(--amber-500); color: var(--cream-50);
                  border-color: var(--amber-500); font-weight: 500; }

  .cm-body { display: grid; grid-template-columns: 1fr 1.7fr; gap: 14px;
             flex: 1; min-height: 0; }
  .cm-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
             display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .cm-card-h { padding: 16px 18px 12px; border-bottom: 1px solid var(--line);
               display: flex; align-items: flex-start; justify-content: space-between; }
  .cm-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .cm-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

  .cm-search { display: flex; align-items: center; gap: 8px; background: var(--cream-100);
               border: 1px solid var(--line); border-radius: 8px;
               padding: 7px 10px; margin: 10px 18px; }
  .cm-search input { border: none; outline: none; background: transparent; flex: 1; font-size: 12px; }
  .cm-list { overflow: auto; flex: 1; }
  .cm-list-row { display: grid; grid-template-columns: 14px 24px 1fr 60px 24px; gap: 10px;
                 align-items: center; padding: 9px 18px;
                 border-bottom: 1px dashed var(--line);
                 cursor: pointer; position: relative; }
  .cm-list-row:hover { background: var(--cream-100); }
  .cm-list-row.active { background: var(--amber-100); }
  .cm-list-row.active::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                                  width: 2px; background: var(--amber-500); }
  .cm-drag { color: var(--ink-500); cursor: grab; }
  .cm-list-mark { width: 24px; height: 24px; border-radius: 6px; color: var(--cream-50);
                  display: flex; align-items: center; justify-content: center;
                  font-family: var(--font-display); font-style: italic; font-size: 13px; }
  .cm-list-name { font-size: 13px; color: var(--ink-800); }
  .cm-list-meta { font-size: 11px; color: var(--ink-500); margin-top: 1px; font-family: var(--font-mono); }
  .cm-list-amt { font-family: var(--font-mono); font-size: 12px; color: var(--ink-700); text-align: right; }

  .cm-editor { padding: 18px 22px; display: flex; flex-direction: column;
               gap: 16px; overflow: auto; }
  .cm-section-h { font-size: 10px; color: var(--ink-500); letter-spacing: 0.1em;
                  text-transform: uppercase; margin-bottom: 8px; }
  .cm-row { display: grid; grid-template-columns: 130px 1fr; gap: 18px; align-items: center; }
  .cm-input { background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px;
              padding: 8px 12px; font-size: 13px; color: var(--ink-800);
              font-family: inherit; outline: none; }
  .cm-input:focus { border-color: var(--amber-500); }

  .cm-color-picker { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .cm-color { width: 26px; height: 26px; border-radius: 7px; cursor: pointer;
              border: 2px solid transparent; }
  .cm-color.selected { border-color: var(--ink-800); }
  .cm-color-custom { width: 26px; height: 26px; border-radius: 7px;
                     border: 1.5px dashed var(--line-strong);
                     display: flex; align-items: center; justify-content: center;
                     color: var(--ink-500); cursor: pointer; }

  .cm-icon-grid { display: flex; gap: 6px; flex-wrap: wrap; }
  .cm-icon { width: 30px; height: 30px; border-radius: 7px;
             background: var(--cream-100); border: 1px solid var(--line);
             display: flex; align-items: center; justify-content: center;
             color: var(--ink-600); cursor: pointer; }
  .cm-icon.selected { background: var(--amber-100); border-color: var(--amber-500); color: var(--amber-500); }

  .cm-budget { display: flex; align-items: center; gap: 14px; }
  .cm-budget-input { display: flex; align-items: baseline; gap: 4px;
                     background: var(--cream-100); border: 1px solid var(--line);
                     border-radius: 8px; padding: 6px 12px; }
  .cm-budget-input .num { font-family: var(--font-display); font-size: 28px;
                          color: var(--ink-900); line-height: 1; }
  .cm-budget-input .cur { font-family: var(--font-display); font-size: 18px; color: var(--ink-500); }
  .cm-budget-bar { flex: 1; height: 6px; background: var(--grid-line);
                   border-radius: 999px; position: relative; }
  .cm-budget-bar > .fill { height: 100%; background: var(--amber-500); border-radius: 999px; }
  .cm-budget-bar > .thumb { position: absolute; width: 16px; height: 16px; border-radius: 50%;
                            background: var(--amber-500); top: -5px;
                            border: 3px solid var(--cream-50);
                            box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

  .cm-rules-add { padding: 12px 18px; display: flex; align-items: center; gap: 10px;
                  background: var(--cream-100);
                  border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
  .cm-rule { display: grid; grid-template-columns: 18px 1fr 28px 24px 24px; gap: 10px;
             align-items: center; padding: 10px 18px;
             border-bottom: 1px dashed var(--line); }
  .cm-rule:last-child { border-bottom: none; }
  .cm-rule-toggle { width: 28px; height: 16px; background: var(--sage-500);
                    border-radius: 999px; position: relative; cursor: pointer; }
  .cm-rule-toggle::after { content: ""; position: absolute; right: 2px; top: 2px;
                           width: 12px; height: 12px; border-radius: 50%;
                           background: var(--cream-50); }
  .cm-rule-toggle.off { background: var(--cream-200); }
  .cm-rule-toggle.off::after { right: auto; left: 2px; }
  .cm-rule-body { display: flex; flex-direction: column; gap: 2px; }
  .cm-rule-cond { font-size: 12px; color: var(--ink-800); }
  .cm-rule-cond strong { font-family: var(--font-mono); background: var(--cream-200);
                         padding: 1px 6px; border-radius: 4px; font-weight: 400; }
  .cm-rule-meta { font-size: 11px; color: var(--ink-500); }
  .cm-rule-count { font-family: var(--font-mono); font-size: 11px; color: var(--ink-700);
                   background: var(--cream-200); padding: 2px 7px; border-radius: 999px; }

  /* DETAIL VIEW */
  .cd-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px;
             height: 100%; overflow: auto;
             background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
  .cd-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em;
              text-transform: uppercase;
              display: flex; align-items: center; gap: 6px; }
  .cd-bread .crumb-link { cursor: pointer; }
  .cd-bread .crumb-link:hover { color: var(--amber-500); }
  .cd-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }

  .cd-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .cd-h-left { display: flex; align-items: center; gap: 16px; }
  .cd-mark { width: 56px; height: 56px; border-radius: 14px;
             display: flex; align-items: center; justify-content: center;
             color: var(--cream-50); font-family: var(--font-display);
             font-style: italic; font-size: 26px; }
  .cd-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400;
           color: var(--ink-900); letter-spacing: -0.01em; line-height: 1; }
  .cd-h-desc { font-size: 12px; color: var(--ink-500); margin-top: 5px; }
  .cd-tool { display: flex; gap: 8px; align-items: center; }
  .cd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px;
            background: var(--cream-50); color: var(--ink-700);
            font-size: 12px; cursor: pointer; }

  .cd-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .cd-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
             padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
  .cd-card-l { font-size: 10px; color: var(--ink-500);
               letter-spacing: 0.08em; text-transform: uppercase; }
  .cd-card-v { font-family: var(--font-display); font-size: 26px;
               color: var(--ink-900); line-height: 1.1; margin-top: 4px; }
  .cd-card-s { font-size: 11px; color: var(--ink-500); }
  .cd-delta-up { color: var(--rose-500); }

  .cd-chart-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px; padding: 18px 20px;
                   display: flex; flex-direction: column; gap: 14px; }
  .cd-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
  .cd-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .cd-card-ss { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

  .cd-bot { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 12px;
            min-height: 0; }
  .cd-bot-card { padding: 16px 18px !important; gap: 12px !important; overflow: hidden; }

  .cd-bar-row { padding: 8px 0; border-bottom: 1px dashed var(--line); }
  .cd-bar-row:last-child { border-bottom: none; }
  .cd-bar-meta { display: flex; align-items: center; justify-content: space-between;
                 font-size: 12.5px; margin-bottom: 6px; }
  .cd-bar-meta .pct { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
  .cd-bar-meta .amt { font-family: var(--font-mono); font-size: 12px; color: var(--ink-800); }
  .cd-bar { height: 5px; background: var(--grid-line);
            border-radius: 999px; overflow: hidden; }

  .cd-merch-row { display: grid; grid-template-columns: 32px 1fr auto auto;
                  align-items: center; gap: 10px; padding: 9px 0;
                  border-bottom: 1px dashed var(--line); }
  .cd-merch-row:last-child { border-bottom: none; }
  .cd-merch-mark { width: 32px; height: 32px; border-radius: 8px;
                   background: var(--cream-200);
                   font-family: var(--font-display); font-style: italic; font-size: 16px;
                   color: var(--ink-700);
                   display: flex; align-items: center; justify-content: center; }
  .cd-merch-name { font-size: 13px; color: var(--ink-800); }
  .cd-merch-n { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }
  .cd-merch-sum { font-family: var(--font-mono); font-size: 12.5px;
                  color: var(--ink-800); font-weight: 500; }

  .cd-tx-row { display: grid; grid-template-columns: 60px 1fr 90px;
               align-items: center; gap: 12px; padding: 9px 0;
               border-bottom: 1px dashed var(--line); }
  .cd-tx-row:last-child { border-bottom: none; }
  .cd-tx-date { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
  .cd-tx-amt { font-family: var(--font-mono); text-align: right;
               color: var(--ink-800); font-weight: 500; font-size: 12.5px; }

  /* EMPTY VIEW */
  .ce-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 18px;
             height: 100%; overflow: auto;
             background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
  .ce-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em;
              text-transform: uppercase;
              display: flex; align-items: center; gap: 6px; }
  .ce-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .ce-bread .crumb-link { cursor: pointer; }
  .ce-bread .crumb-link:hover { color: var(--amber-500); }

  .ce-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .ce-h-left { display: flex; align-items: center; gap: 16px; }
  .ce-mark { width: 56px; height: 56px; border-radius: 14px;
             display: flex; align-items: center; justify-content: center;
             color: var(--cream-50); font-family: var(--font-display);
             font-style: italic; font-size: 26px; }
  .ce-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400;
           color: var(--ink-900); letter-spacing: -0.01em; line-height: 1; }
  .ce-h-desc { font-size: 12px; color: var(--ink-500); margin-top: 5px; }
  .ce-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px;
            background: var(--cream-50); color: var(--ink-700);
            font-size: 12px; cursor: pointer; }

  .ce-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .ce-kpi { background: var(--cream-50); border: 1px solid var(--line);
            border-radius: 12px; padding: 16px 18px; opacity: 0.7; }
  .ce-kpi-l { font-size: 10px; color: var(--ink-500);
              letter-spacing: 0.08em; text-transform: uppercase; }
  .ce-kpi-v { font-family: var(--font-display); font-size: 26px;
              color: var(--ink-400); margin-top: 4px; }
  .ce-kpi-s { font-size: 11px; color: var(--ink-500); margin-top: 4px;
              font-family: var(--font-mono); }

  .ce-hero { min-height: 360px; display: grid;
             grid-template-columns: 1.1fr 1fr; gap: 14px; }
  .ce-card { background: var(--cream-50); border: 1px solid var(--line);
             border-radius: 14px; padding: 22px 26px;
             display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
  .ce-hero-empty { background: var(--cream-50);
                   border: 1.5px dashed rgba(122,92,58,0.4);
                   border-radius: 14px; padding: 36px;
                   display: flex; flex-direction: column;
                   align-items: center; justify-content: center; gap: 14px;
                   text-align: center; position: relative; overflow: hidden; }
  .ce-hero-empty::before { content: ""; position: absolute; inset: 0; opacity: 0.6;
                           background-image: radial-gradient(circle at 50% 0%, rgba(122,92,58,0.06), transparent 60%); }
  .ce-hero-empty > * { position: relative; z-index: 1; }
  .ce-empty-ico { width: 64px; height: 64px; border-radius: 16px;
                  background: rgba(122,92,58,0.10);
                  display: flex; align-items: center; justify-content: center; }
  .ce-empty-t { font-family: var(--font-display); font-size: 30px; line-height: 1.1;
                color: var(--ink-900); letter-spacing: -0.01em; max-width: 460px; }
  .ce-empty-t em { font-style: italic; }
  .ce-empty-s { font-size: 13.5px; color: var(--ink-600); line-height: 1.55; max-width: 480px; }
  .ce-empty-actions { display: flex; gap: 10px; margin-top: 6px; }
  .ce-empty-actions button { padding: 9px 16px; border-radius: 9px;
                             font-size: 13px; cursor: pointer; }

  .ce-trend { padding-top: 16px; border-top: 1px solid var(--line); margin-top: 8px;
              display: flex; align-items: center; justify-content: space-between; width: 100%; }
  .ce-trend-l { font-size: 11px; color: var(--ink-500); }
  .ce-trend-flat { height: 24px; flex: 1; margin: 0 18px; position: relative; }
  .ce-trend-flat::after { content: ""; position: absolute; left: 0; right: 0; top: 50%;
                          height: 1px; background: var(--line);
                          border-top: 1px dashed var(--line-strong); }

  .ce-card-h { display: flex; align-items: flex-start; justify-content: space-between;
               margin-bottom: 12px; }
  .ce-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .ce-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

  .ce-sg-row { display: grid; grid-template-columns: 56px 1fr 100px 90px;
               align-items: center; gap: 10px; padding: 11px 0;
               border-bottom: 1px dashed var(--line); }
  .ce-sg-row:last-child { border-bottom: none; }
  .ce-sg-date { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
  .ce-sg-lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .ce-sg-sub { font-size: 10.5px; color: var(--ink-500); font-family: var(--font-mono);
               margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }
  .ce-sg-cur { font-size: 10.5px; padding: 3px 9px; border-radius: 999px;
               border: 1px dashed var(--line-strong); color: var(--ink-500);
               display: inline-flex; align-items: center; gap: 5px; justify-self: start; }
  .ce-sg-act { display: flex; gap: 4px; justify-content: flex-end; }

  .ce-rule-tip { background: rgba(122,92,58,0.08); border: 1px solid rgba(122,92,58,0.25);
                 border-radius: 10px; padding: 14px;
                 display: flex; gap: 12px; align-items: flex-start; margin-top: 12px; }
  .ce-rule-tip-ico { width: 28px; height: 28px; border-radius: 7px;
                     background: var(--cream-50);
                     display: flex; align-items: center; justify-content: center;
                     flex-shrink: 0; }
  .ce-rule-tip-t { font-size: 12.5px; color: var(--ink-900); font-weight: 500; }
  .ce-rule-tip-s { font-size: 11.5px; color: var(--ink-600); margin-top: 3px; line-height: 1.5; }
`;
