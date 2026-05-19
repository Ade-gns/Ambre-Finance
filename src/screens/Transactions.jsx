/* Écran Transactions — 4 états gérés via useState
   1. default — table groupée par semaine
   2. detail  — panneau latéral ouvert sur une transaction
   3. empty   — aucun résultat / aucune donnée
   4. bulk    — sélection multiple (bulk actions bar) */

import { useState } from "react";
import { CATEGORIES } from "../data/mockData";
import { fmtEUR } from "../lib/chartPrimitives";
import {
  IcSearch, IcCalendar, IcFilter, IcArrowDn, IcChevDn,
  IcPlus, IcTag, IcUpload
} from "../lib/icons";

/* ─────────────────────────────────────────────────────────────────
   Données enrichies pour la liste (mock — viendront de SQLite plus tard)
   ───────────────────────────────────────────────────────────────── */
const TX_LIST = [
  // Semaine du 12 mai
  { d: "14/05", dow: "Mer", lbl: "Carrefour Market",      sub: "Rue Saint-Honoré · Paris", acc: "BNP", cat: "alim", mode: "CB",          amt: -52.34, tags: ["récurrent"] },
  { d: "14/05", dow: "Mer", lbl: "Uber",                  sub: "Trajet Bastille→Bercy",    acc: "BNP", cat: "tra",  mode: "CB",          amt: -12.80 },
  { d: "13/05", dow: "Mar", lbl: "Loyer — Mai",           sub: "SCI Pradier",              acc: "BNP", cat: "loy",  mode: "Virement",    amt: -920.00, tags: ["récurrent"] },
  { d: "12/05", dow: "Lun", lbl: "Salaire",               sub: "Dupont SAS",               acc: "BNP", cat: "inc",  mode: "Virement",    amt: +2560.00, tags: ["récurrent"] },
  { d: "12/05", dow: "Lun", lbl: "Spotify Premium",       sub: "Abonnement mensuel",       acc: "BNP", cat: "abo",  mode: "Préautorisé", amt: -10.99, tags: ["récurrent"] },
  // Semaine du 5 mai
  { d: "11/05", dow: "Dim", lbl: "SNCF — Paris ↔ Lyon",   sub: "TGV inOui",                acc: "BNP", cat: "tra",  mode: "CB",          amt: -67.00 },
  { d: "11/05", dow: "Dim", lbl: "FNAC.COM",              sub: "Commande #FN-203984",      acc: "BNP", cat: "loi",  mode: "CB",          amt: -29.90 },
  { d: "10/05", dow: "Sam", lbl: "Boulangerie Pichon",    sub: "Quartier latin",           acc: "BNP", cat: "alim", mode: "CB",          amt: -8.40 },
  { d: "10/05", dow: "Sam", lbl: "Le Petit Café",         sub: "Rue Mouffetard",           acc: "BNP", cat: "loi",  mode: "CB",          amt: -14.20 },
  { d: "09/05", dow: "Ven", lbl: "Pharmacie de l'Hôtel",  sub: "Sénac · ordonnance",       acc: "BNP", cat: "san",  mode: "CB",          amt: -22.50 },
  { d: "08/05", dow: "Jeu", lbl: "Total Énergies",        sub: "Station Bercy",            acc: "BNP", cat: "tra",  mode: "CB",          amt: -48.10 },
  { d: "07/05", dow: "Mer", lbl: "Monoprix",              sub: "Rue Dampierre",            acc: "BNP", cat: "alim", mode: "CB",          amt: -39.85 },
  { d: "06/05", dow: "Mar", lbl: "Netflix",               sub: "Standard sans pub",        acc: "BNP", cat: "abo",  mode: "Préautorisé", amt: -13.49, tags: ["récurrent"] },
  // Semaine du 28 avril
  { d: "05/05", dow: "Lun", lbl: "Auchan Drive",          sub: "Courses semaine",          acc: "BNP", cat: "alim", mode: "CB",          amt: -82.40 },
  { d: "04/05", dow: "Dim", lbl: "Cinéma MK2",            sub: "Bibliothèque",             acc: "BNP", cat: "loi",  mode: "CB",          amt: -22.00 },
  { d: "03/05", dow: "Sam", lbl: "Livret A — Versement",  sub: "Virement interne",         acc: "LBP", cat: "epa",  mode: "Virement",    amt: -300.00 },
  { d: "02/05", dow: "Ven", lbl: "Restaurant Le Pic",     sub: "Déjeuner",                 acc: "BNP", cat: "alim", mode: "CB",          amt: -34.50 },
  { d: "01/05", dow: "Jeu", lbl: "1er mai — Marché",      sub: "Place Monge",              acc: "BNP", cat: "alim", mode: "Espèces",     amt: -18.00 },
];

const TX_FILTERS = [
  { id: "alim", label: "Alimentation", color: "#b8693d" },
  { id: "tra",  label: "Transports",   color: "#6b7a4f" },
];

function txCatStyle(cat) {
  if (cat === "inc") return { color: "#6b7a4f", label: "Revenus" };
  if (cat === "epa") return { color: "#9d8b73", label: "Épargne" };
  const c = CATEGORIES.find(x => x.id === cat);
  return c ? { color: c.color, label: c.label } : { color: "#9d8b73", label: "Autre" };
}

/* ─────────────────────────────────────────────────────────────────
   Composant principal — décide quelle variante afficher
   ───────────────────────────────────────────────────────────────── */
export default function Transactions() {
  const [state, setState] = useState("default"); // default | detail | empty | bulk

  return (
    <>
      <DemoStateSwitcher current={state} onChange={setState} />
      <style>{TX_STYLES}</style>

      {state === "default" && <TxDefault onRowClick={() => setState("detail")}
                                          onSelectMany={() => setState("bulk")} />}
      {state === "detail"  && <TxDetail  onClose={() => setState("default")} />}
      {state === "empty"   && <TxEmpty />}
      {state === "bulk"    && <TxBulk    onClose={() => setState("default")} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Barre de switch (temporaire, pour visualiser les 4 états)
   ───────────────────────────────────────────────────────────────── */
function DemoStateSwitcher({ current, onChange }) {
  const states = [
    { key: "default", label: "1. Liste" },
    { key: "detail",  label: "2. Détail" },
    { key: "empty",   label: "3. Vide" },
    { key: "bulk",    label: "4. Sélection" },
  ];
  return (
    <div style={{
      position: "fixed", top: 8, right: 16, zIndex: 100,
      display: "flex", gap: 4, padding: 4,
      background: "rgba(255,255,255,0.9)", backdropFilter: "blur(8px)",
      border: "1px solid var(--line)", borderRadius: 8, fontSize: 11,
    }}>
      <span style={{ padding: "4px 8px", color: "var(--ink-500)",
                     letterSpacing: "0.04em", textTransform: "uppercase" }}>Démo</span>
      {states.map(s => (
        <button key={s.key} onClick={() => onChange(s.key)} style={{
          padding: "4px 10px", borderRadius: 5, fontSize: 11,
          background: current === s.key ? "var(--amber-500)" : "transparent",
          color: current === s.key ? "var(--cream-50)" : "var(--ink-700)",
          border: "none", cursor: "pointer",
        }}>{s.label}</button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Atomes partagés par les 4 vues
   ───────────────────────────────────────────────────────────────── */
function TxHeader() {
  return (
    <div className="tx-top">
      <div>
        <div className="tx-bread">Ambre · <strong>Transactions</strong></div>
        <h1 className="tx-h1">Mes <em>transactions</em>.</h1>
      </div>
      <div className="tx-h1-actions">
        <button className="tx-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>
          </svg>
          Exporter
        </button>
        <button className="tx-btn amber"><IcUpload size={14}/>Importer un relevé</button>
      </div>
    </div>
  );
}

function TxFilterBar({ withChips = true, filter = "all", onChangeFilter = () => {}, counts = { all: 18, exp: 16, inc: 1, tr: 1 } }) {
  const segs = [
    { key: "all", label: "Tout",       n: counts.all },
    { key: "exp", label: "Dépenses",   n: counts.exp },
    { key: "inc", label: "Revenus",    n: counts.inc },
    { key: "tr",  label: "Transferts", n: counts.tr },
  ];
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
          <input placeholder="Rechercher un libellé, un montant…" readOnly value=""/>
          <span className="tx-search-kbd">⌘F</span>
        </div>
        <button className="tx-btn"><IcCalendar size={14}/>Mai 2026 <IcChevDn size={12}/></button>
        <button className="tx-btn"><IcFilter size={14}/>Filtres <span className="tx-badge">3</span></button>
        <button className="tx-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h13M3 12h9M3 18h5M14 10l3 3-3 3M17 13H21"/>
          </svg>
          Date ↓
        </button>
      </div>

      {withChips && (
        <div className="tx-chips">
          <span className="tx-chip-lbl">Filtres actifs</span>
          {TX_FILTERS.map(f => (
            <span key={f.id} className="tx-chip" style={{ borderColor: f.color + "55", color: f.color }}>
              <span className="amb-dot" style={{ background: f.color }}/>
              {f.label}
              <IcPlus size={11} style={{ transform: "rotate(45deg)" }}/>
            </span>
          ))}
          <span className="tx-chip">
            <span className="amb-dot" style={{ background: "var(--ink-500)" }}/>
            Montant ≤ −10 €
            <IcPlus size={11} style={{ transform: "rotate(45deg)" }}/>
          </span>
          <span className="tx-chip">
            <IcCalendar size={11}/>
            1 mai → aujourd'hui
            <IcPlus size={11} style={{ transform: "rotate(45deg)" }}/>
          </span>
          <button className="tx-chip clear">Tout effacer</button>
        </div>
      )}
    </>
  );
}

function TxSummary() {
  return (
    <div className="tx-summary">
      <span><strong>18 transactions</strong> · mai 2026</span>
      <span>Débit · <strong className="mono" style={{ color: "var(--rose-500)" }}>−1 696,47 €</strong></span>
      <span>Crédit · <strong className="mono" style={{ color: "var(--sage-500)" }}>+2 560,00 €</strong></span>
      <span>Moyenne · <strong className="mono">42 €</strong></span>
      <span style={{ marginLeft: "auto", color: "var(--ink-500)" }}>Dernière sync · il y a 2 min</span>
    </div>
  );
}

function TxRow({ t, selected, bulk, dense, onClick }) {
  const cat = txCatStyle(t.cat);
  return (
    <div className={"tx-row" +
                    (selected ? " selected" : "") +
                    (bulk ? " bulk" : "") +
                    (dense ? " dense" : "")}
         onClick={onClick}>
      <span className="tx-cb"/>
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
function TxDefault({ onRowClick, onSelectMany }) {
  const [filter, setFilter] = useState("all");

  // Calcul des compteurs : "exp" = dépenses (amt < 0 et cat != "epa"), "inc" = revenus (amt > 0), "tr" = transferts (cat == "epa")
  const allTxs = TX_LIST;
  const cExp = allTxs.filter(t => t.amt < 0 && t.cat !== "epa").length;
  const cInc = allTxs.filter(t => t.amt > 0).length;
  const cTr  = allTxs.filter(t => t.cat === "epa").length;
  const counts = { all: allTxs.length, exp: cExp, inc: cInc, tr: cTr };

  const matchFilter = (t) => {
    if (filter === "all") return true;
    if (filter === "exp") return t.amt < 0 && t.cat !== "epa";
    if (filter === "inc") return t.amt > 0;
    if (filter === "tr")  return t.cat === "epa";
    return true;
  };

  const groups = [
    { label: "Cette semaine · 12 – 14 mai",         sum: -1043.93, rows: TX_LIST.slice(0, 5) },
    { label: "Semaine du 5 mai · 5 – 11 mai",        sum: -253.34,  rows: TX_LIST.slice(5, 13) },
    { label: "Semaine du 28 avr. · 28 avr. – 4 mai", sum: -456.90,  rows: TX_LIST.slice(13) },
  ];

  return (
    <main className="tx-main">
      <TxHeader />
      <TxFilterBar filter={filter} onChangeFilter={setFilter} counts={counts}/>
      <TxSummary />

      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          {groups.map((g, gi) => {
            const filteredRows = g.rows.filter(matchFilter);
            if (filteredRows.length === 0) return null;
            return (
              <div key={g.label}>
                <div className="tx-group-h">
                  <span>{g.label}</span>
                  <span className="sum">{g.sum > 0 ? "+" : ""}{fmtEUR(g.sum, 2)}</span>
                </div>
                {filteredRows.map((t, i) => (
                  <TxRow key={gi + "-" + i} t={t}
                         onClick={i === 0 && gi === 0 ? onRowClick : undefined}/>
                ))}
              </div>
            );
          })}
        </div>
        <div className="tx-pagination">
          <span>Affichées {allTxs.filter(matchFilter).length} sur {allTxs.length} · <strong>page 1 sur 1</strong></span>
          <div className="tx-pager">
            <button className="tx-btn" disabled>←</button>
            <button className="tx-btn active">1</button>
            <button className="tx-btn" disabled>→</button>
          </div>
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="tx-btn ghost" onClick={onSelectMany} style={{ fontSize: 11 }}>
              Sélectionner plusieurs
            </button>
            <span>Voir : <strong>50 par page</strong></span>
          </span>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 2 — Liste + panneau de détail
   ───────────────────────────────────────────────────────────────── */
function TxDetail({ onClose }) {
  const tSel = TX_LIST[0];
  const catSel = txCatStyle(tSel.cat);

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "1fr 360px",
      height: "100%",
      background: "#efe7d6",
    }}>
      <main className="tx-main with-panel">
        <TxHeader />
        <TxFilterBar />
        <TxSummary />

        <div className="tx-table">
          <TxTableHead />
          <div className="tx-tbody">
            <div className="tx-group-h">
              <span>Cette semaine · 12 – 14 mai</span>
              <span className="sum">−1 043,93 €</span>
            </div>
            {TX_LIST.slice(0, 5).map((t, i) => (
              <TxRow key={i} t={t} selected={i === 0}/>
            ))}
            <div className="tx-group-h">
              <span>Semaine du 5 mai · 5 – 11 mai</span>
              <span className="sum">−253,34 €</span>
            </div>
            {TX_LIST.slice(5, 11).map((t, i) => <TxRow key={"w2-" + i} t={t} dense/>)}
          </div>
        </div>
      </main>

      <aside className="tx-detail">
        <button className="tx-detail-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>

        <div>
          <div className="tx-detail-h">Détail · 14/05/2026 · Mercredi</div>
          <div className="tx-detail-amt">
            <span className="cur">−€</span>52<span className="cents">,34</span>
          </div>
          <div className="tx-detail-lbl">Carrefour Market</div>
          <div className="tx-detail-sub">Rue Saint-Honoré · Paris · 14h28</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="tx-field editable">
            <span className="lbl">Catégorie</span>
            <span className="val" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="amb-dot" style={{ background: catSel.color }}/>
              {catSel.label}
              <IcChevDn size={12}/>
            </span>
          </div>
          <div className="tx-field">
            <span className="lbl">Compte</span>
            <span className="val">Compte courant · BNP</span>
          </div>
          <div className="tx-field">
            <span className="lbl">Mode</span>
            <span className="val">Carte bancaire</span>
          </div>
          <div className="tx-field">
            <span className="lbl">Référence</span>
            <span className="val mono" style={{ fontSize: 11 }}>FR76 3000 4001 …7849</span>
          </div>
        </div>

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

        <div className="tx-detail-section">
          <div className="tx-detail-section-t">
            Transactions similaires <span style={{ color: "var(--amber-500)" }}>· 5</span>
          </div>
          <div className="tx-similar">
            {[
              { d: "07/05", amt: -39.85, lbl: "Monoprix" },
              { d: "05/05", amt: -82.40, lbl: "Auchan Drive" },
              { d: "27/04", amt: -82.40, lbl: "Auchan Drive" },
              { d: "23/04", amt: -42.10, lbl: "Monoprix Rue Dampierre" },
            ].map((s, i) => (
              <div key={i} className="tx-similar-row">
                <span className="date">{s.d}</span>
                <span style={{ color: "var(--ink-800)" }}>{s.lbl}</span>
                <span className="amt">{fmtEUR(s.amt, 2)}</span>
              </div>
            ))}
          </div>
        </div>

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
            <div className="tx-rule-t">Toujours classer « Carrefour » en Alimentation ?</div>
            <div className="tx-rule-s">5 transactions similaires existent déjà.</div>
            <button className="tx-btn amber tx-rule-cta" style={{ padding: "5px 10px", fontSize: 11 }}>
              Créer la règle
            </button>
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
          <button className="tx-danger-btn">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            Supprimer
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
function TxBulk({ onClose }) {
  const selectedIdxs = new Set([0, 1, 5, 6, 7]);

  return (
    <main className="tx-main">
      <TxHeader />

      {/* Bulk action bar (remplace la toolbar) */}
      <div className="tx-bulk-bar">
        <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="tx-cb" style={{ background: "var(--amber-500)", border: "none", position: "relative" }}>
            <span style={{ position: "absolute", left: 3, top: 0, width: 4, height: 8,
                          borderRight: "1.5px solid white", borderBottom: "1.5px solid white",
                          transform: "rotate(45deg)" }}/>
          </span>
          <span className="tx-bulk-count">5</span>
          <span style={{ fontSize: 12, color: "var(--cream-300)" }}>transactions sélectionnées · 217,93 €</span>
        </span>
        <span style={{ fontSize: 11, color: "var(--cream-300)" }}>Tout sélectionner (18) · Désélectionner</span>
        <span className="tx-bulk-sep"/>
        <button className="tx-bulk-action amber">
          <IcTag size={13}/>Re-catégoriser… <IcChevDn size={11}/>
        </button>
        <div className="tx-cat-picker">
          <span><span className="amb-dot" style={{ background: "#b8693d" }}/>Alimentation</span>
          <span className="hi"><span className="amb-dot" style={{ background: "#6b7a4f" }}/>Transports</span>
          <span><span className="amb-dot" style={{ background: "#a85a48" }}/>Loisirs</span>
        </div>
        <span className="tx-bulk-sep"/>
        <button className="tx-bulk-action">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
          </svg>
          Créer une règle
        </button>
        <button className="tx-bulk-action">Exporter…</button>
        <button className="tx-bulk-action danger">
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

      <TxSummary />

      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          <div className="tx-group-h">
            <span>Cette semaine · 12 – 14 mai</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--amber-500)",
                          fontFamily: "var(--font-mono)" }}>
              2 sélectionnées · −65,14 €
            </span>
          </div>
          {TX_LIST.slice(0, 5).map((t, i) => (
            <TxRow key={"a-" + i} t={t} bulk={selectedIdxs.has(i)}/>
          ))}
          <div className="tx-group-h">
            <span>Semaine du 5 mai · 5 – 11 mai</span>
            <span style={{ marginLeft: "auto", fontSize: 11, color: "var(--amber-500)",
                          fontFamily: "var(--font-mono)" }}>
              3 sélectionnées · −152,79 €
            </span>
          </div>
          {TX_LIST.slice(5, 11).map((t, i) => (
            <TxRow key={"b-" + i} t={t} bulk={selectedIdxs.has(i + 5)}/>
          ))}
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
             background: #efe7d6; color: var(--ink-800); font-size: 13px; }
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
  .tx-row.bulk { background: rgba(184,105,61,0.08); }
  .tx-row.bulk .tx-cb { background: var(--amber-500); border-color: var(--amber-500); position: relative; }
  .tx-row.bulk .tx-cb::after { content: ""; position: absolute; left: 3px; top: 0px;
                                width: 4px; height: 8px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0;
                                transform: rotate(45deg); }

  .tx-cb { width: 14px; height: 14px; border: 1.5px solid var(--line-strong); border-radius: 3.5px; }

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
                 box-shadow: 0 4px 14px rgba(61,40,23,0.18); }
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
`;
