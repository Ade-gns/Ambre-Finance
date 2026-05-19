/* Écran Catégories — 3 vues gérées via useState
   1. manage — vue principale, liste + édition + règles
   2. detail — vue par catégorie (KPIs, courbe, sous-cats, marchands, transactions)
   3. empty  — catégorie créée mais sans transactions (avec suggestions) */

import { useState } from "react";
import { CATEGORIES, TRANSACTIONS } from "../data/mockData";
import { fmtEUR, pathSmooth } from "../lib/chartPrimitives";
import {
  IcSearch, IcCalendar, IcFilter, IcArrowR, IcChevDn,
  IcPlus, IcTag, IcSettings, IcChart, IcWallet
} from "../lib/icons";

export default function Categories() {
  const [state, setState] = useState("manage"); // manage | detail | empty

  return (
    <>
      <DemoStateSwitcher current={state} onChange={setState} />

      {state === "manage" && <CatManage onSeeDetail={() => setState("detail")}
                                        onSeeEmpty={() => setState("empty")} />}
      {state === "detail" && <CatDetail onBack={() => setState("manage")} />}
      {state === "empty"  && <CatEmpty  onBack={() => setState("manage")} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Barre de switch temporaire (mode démo)
   ───────────────────────────────────────────────────────────────── */
function DemoStateSwitcher({ current, onChange }) {
  const states = [
    { key: "manage", label: "1. Gestion" },
    { key: "detail", label: "2. Détail" },
    { key: "empty",  label: "3. Vide" },
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
   Vue 1 — Gestion des catégories (liste + édition + règles)
   ───────────────────────────────────────────────────────────────── */
function CatManage({ onSeeDetail, onSeeEmpty }) {
  const allCats = [
    ...CATEGORIES.map(c => ({ ...c })),
    { id: "epa", label: "Épargne",     color: "#9d8b73", amount: 300.00, share: 0.10 },
    { id: "fou", label: "Restaurants", color: "#a85a48", amount: 68.50,  share: 0.04 },
    { id: "edu", label: "Éducation",   color: "#7a5c3a", amount: 0,      share: 0 },
  ];
  const selected = allCats.find(c => c.id === "alim");

  const rules = [
    { id: 1, when: "libellé contient", op: "carrefour",                to: "alim", auto: 14, last: "14/05" },
    { id: 2, when: "libellé contient", op: "monoprix",                 to: "alim", auto: 8,  last: "07/05" },
    { id: 3, when: "libellé contient", op: "boulangerie OU patisserie", to: "alim", auto: 12, last: "10/05" },
    { id: 4, when: "marchand =",       op: "Auchan Drive",              to: "alim", auto: 6,  last: "05/05" },
    { id: 5, when: "libellé contient", op: "fnac.com",                  to: "loi",  auto: 3,  last: "11/05" },
  ];

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
          <button className="cm-btn">Importer / Exporter</button>
          <button className="cm-btn amber"><IcPlus size={14}/>Nouvelle catégorie</button>
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
            <button className="cm-btn" style={{ padding: "4px 8px", fontSize: 11 }}>
              <IcFilter size={11}/>Trier
            </button>
          </div>
          <div className="cm-search">
            <IcSearch size={13}/>
            <input placeholder="Rechercher une catégorie…" readOnly value=""/>
          </div>
          <div className="cm-list">
            {allCats.map(c => (
              <div key={c.id}
                   className={"cm-list-row" + (c.id === "alim" ? " active" : "")}
                   onClick={() => c.id === "alim" ? onSeeDetail() : (c.id === "edu" ? onSeeEmpty() : null)}>
                <span className="cm-drag">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                    <circle cx="3" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>
                    <circle cx="3" cy="7" r="1.2"/><circle cx="9" cy="7" r="1.2"/>
                    <circle cx="3" cy="11" r="1.2"/><circle cx="9" cy="11" r="1.2"/>
                  </svg>
                </span>
                <div className="cm-list-mark" style={{ background: c.color }}>{c.label[0].toLowerCase()}</div>
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
                            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18 }}>a</div>
              <div>
                <div className="cm-card-t" style={{ fontSize: 15 }}>{selected.label}</div>
                <div className="cm-card-s">12 mois · 142 transactions · {fmtEUR(5612, 0)} cumulé</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="cm-btn" onClick={onSeeDetail}>
                Voir le détail <IcArrowR size={12}/>
              </button>
              <button className="cm-btn" style={{ color: "var(--rose-500)", borderColor: "rgba(168,90,72,0.3)" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                Supprimer
              </button>
            </div>
          </div>
          <div className="cm-editor">
            {/* Identity */}
            <div>
              <div className="cm-section-h">Identité</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Nom</label>
                  <input className="cm-input" defaultValue="Alimentation"/>
                </div>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Description</label>
                  <input className="cm-input" defaultValue="Courses, marchés, boulangerie, restaurants, livraisons"/>
                </div>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Couleur</label>
                  <div className="cm-color-picker">
                    {colorOptions.map(c => (
                      <span key={c} className={"cm-color" + (c === "#b8693d" ? " selected" : "")}
                            style={{ background: c }}/>
                    ))}
                    <span className="cm-color-custom"><IcPlus size={14}/></span>
                  </div>
                </div>
                <div className="cm-row">
                  <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Icône</label>
                  <div className="cm-icon-grid">
                    {[
                      { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 8l2-5h14l2 5"/><path d="M3 8v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8"/><circle cx="12" cy="14" r="3"/></svg>, sel: true },
                      { i: <IcTag size={16}/> },
                      { i: <IcWallet size={16}/> },
                      { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8h12v12H6z"/><path d="M9 3v5M15 3v5"/></svg> },
                      { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="9" r="6"/><path d="M9 21l3-5 3 5"/></svg> },
                      { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/></svg> },
                      { i: <IcChart size={16}/> },
                    ].map((it, i) => (
                      <div key={i} className={"cm-icon" + (it.sel ? " selected" : "")}>{it.i}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div>
              <div className="cm-section-h">Budget mensuel</div>
              <div className="cm-budget">
                <div className="cm-budget-input">
                  <span className="cur">€</span>
                  <span className="num">500</span>
                </div>
                <div className="cm-budget-bar">
                  <div className="fill" style={{ width: "97.4%" }}/>
                  <div className="thumb" style={{ left: "calc(97.4% - 8px)" }}/>
                </div>
                <span style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
                  487 € dépensés · 97 %
                </span>
              </div>
              <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 6 }}>
                Une alerte sera envoyée à 85 % et 100 % · <span style={{ color: "var(--amber-500)", cursor: "pointer" }}>modifier les seuils →</span>
              </div>
            </div>

            {/* Rules */}
            <div>
              <div className="cm-section-h">Règles de classement automatique · 5 actives</div>
            </div>
          </div>

          <div className="cm-rules-add">
            <div style={{ flex: 1, fontSize: 12, color: "var(--ink-500)" }}>
              Une transaction sera classée en <strong style={{ color: selected.color }}>{selected.label}</strong> si elle correspond à une des règles ci-dessous.
            </div>
            <button className="cm-btn amber" style={{ padding: "6px 12px", fontSize: 11 }}>
              <IcPlus size={12}/>Nouvelle règle
            </button>
          </div>

          <div style={{ overflow: "auto" }}>
            {rules.map(r => (
              <div key={r.id} className="cm-rule">
                <span className={"cm-rule-toggle" + (r.to !== "alim" ? " off" : "")}/>
                <div className="cm-rule-body">
                  <div className="cm-rule-cond">
                    Si {r.when} <strong>« {r.op} »</strong>
                  </div>
                  <div className="cm-rule-meta">
                    → classer en <strong style={{ color: selected.color }}>{r.to === "alim" ? "Alimentation" : "Loisirs"}</strong>
                    {" · dernière correspondance : " + r.last}
                  </div>
                </div>
                <span className="cm-rule-count">{r.auto}</span>
                <button className="cm-btn" style={{ padding: 0, width: 24, height: 24, justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/>
                  </svg>
                </button>
                <button className="cm-btn" style={{ padding: 0, width: 24, height: 24, justifyContent: "center", color: "var(--rose-500)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 2 — Détail d'une catégorie (drill-down sur Alimentation)
   ───────────────────────────────────────────────────────────────── */
function CatDetail({ onBack }) {
  const cat = {
    id: "alim", label: "Alimentation", color: "#b8693d",
    desc: "Courses, marchés, boulangerie, restaurants, livraisons",
  };

  const months = ["Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc.","Janv.","Févr.","Mars","Avril","Mai"];
  const series = [412, 488, 502, 470, 425, 460, 612, 478, 442, 466, 462, 487];

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

  const txInCat = TRANSACTIONS.filter(t => t.cat === "alim");

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
          <div className="cd-mark" style={{ background: cat.color }}>a</div>
          <div>
            <h1 className="cd-h1">{cat.label}</h1>
            <div className="cd-h-desc">{cat.desc}</div>
          </div>
        </div>
        <div className="cd-tool">
          <button className="cd-btn"><IcCalendar size={14}/>Mai 2026 <IcChevDn size={12}/></button>
          <button className="cd-btn" onClick={onBack}><IcSettings size={14}/>Modifier la catégorie</button>
        </div>
      </div>

      <div className="cd-kpis">
        <div className="cd-card">
          <div className="cd-card-l">Total ce mois</div>
          <div className="cd-card-v">{fmtEUR(487, 0)}</div>
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
            <button className="cd-btn" style={{ padding: "3px 9px", fontSize: 11,
                     background: "var(--amber-100)", color: "var(--amber-500)",
                     borderColor: "rgba(184,105,61,0.3)" }}>12 m</button>
            <button className="cd-btn" style={{ padding: "3px 9px", fontSize: 11 }}>6 m</button>
            <button className="cd-btn" style={{ padding: "3px 9px", fontSize: 11 }}>YTD</button>
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
              <div className="cd-card-ss">détail interne d'Alimentation</div>
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
              <div className="cd-card-t">Transactions · Alimentation</div>
              <div className="cd-card-ss">14 mouvements ce mois</div>
            </div>
            <button className="cd-btn" style={{ padding: "4px 10px", fontSize: 11 }}>
              Voir tout <IcArrowR size={11}/>
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            {txInCat.concat(txInCat).slice(0, 8).map((t, i) => (
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
            <line x1={padX} x2={width - padR} y1={y} y2={y} stroke="rgba(61,40,23,0.07)"/>
            <text x={padX - 6} y={y + 4} textAnchor="end" fontSize="10"
                  fontFamily="var(--font-mono)" fill="rgba(61,40,23,0.5)">
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
              fontFamily="var(--font-ui)" fill="rgba(61,40,23,0.5)">{m}</text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 3 — Catégorie vide (créée mais sans transactions)
   ───────────────────────────────────────────────────────────────── */
function CatEmpty({ onBack }) {
  const cat = {
    id: "edu", label: "Éducation", color: "#7a5c3a",
    desc: "Frais de scolarité, livres, cours en ligne, abonnements éducatifs",
  };

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
          <div className="ce-mark" style={{ background: cat.color }}>é</div>
          <div>
            <h1 className="ce-h1">{cat.label}</h1>
            <div className="ce-h-desc">{cat.desc}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ce-btn"><IcCalendar size={14}/>Mai 2026 <IcChevDn size={12}/></button>
          <button className="ce-btn"><IcSettings size={14}/>Modifier la catégorie</button>
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
            Rien à montrer dans <em>Éducation</em>.
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
              <div className="ce-card-s">3 mouvements récents qui pourraient appartenir à Éducation</div>
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
                    → Éducation
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
                Si vous voulez que toutes les transactions contenant <strong className="mono">« Udemy », « Coursera »</strong> ou
                <strong className="mono"> « Khan Academy »</strong> soient classées en Éducation automatiquement,
                créez une règle depuis Catégories → Règles.
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
             background: #efe7d6; color: var(--ink-800); font-size: 13px; }
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
  .cm-budget-bar { flex: 1; height: 6px; background: rgba(61,40,23,0.07);
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
             background: #efe7d6; color: var(--ink-800); font-size: 13px; }
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
  .cd-bar { height: 5px; background: rgba(61,40,23,0.06);
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
             background: #efe7d6; color: var(--ink-800); font-size: 13px; }
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
