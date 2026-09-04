import { useState } from "react";
import { fmtEUR } from "../../lib/chartUtils";
import { useCategories, useAutoRules } from "../../lib/store";
import { IcLock, IcArrowR, IcChevDn, IcPlus } from "../../lib/icons";
import { fmtSize } from "./csvParser";
import RulesConfigModal from "./RulesConfigModal";

/* ─────────────────────────────────────────────────────────────────
   2. Aperçu — table éditable + récap + règle suggérée
   ───────────────────────────────────────────────────────────────── */
export default function ImportPreview({ onConfirm, onCancel, txs, fileName, fileSize }) {
  const [autoRules, setAutoRules] = useAutoRules();
  const [categories, setCategories] = useCategories();
  const [catOverrides, setCatOverrides] = useState({});
  const [catPickerRow, setCatPickerRow] = useState(null);
  const [filter, setFilter] = useState("all");
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [ruleDismissed, setRuleDismissed] = useState(false);
  const [newCatForRow, setNewCatForRow] = useState(null);
  const [newCatName, setNewCatName]     = useState("");
  const [newCatColor, setNewCatColor]   = useState("#b8693d");

  const createAndAssignCat = rowIdx => {
    if (!newCatName.trim()) return;
    const id = "usr_" + Date.now();
    setCategories(prev => [...prev, { id, label: newCatName.trim(), color: newCatColor, budget: 0, iconIdx: 0 }]);
    setCatOverrides(prev => ({ ...prev, [rowIdx]: id }));
    setCatPickerRow(null); setNewCatForRow(null); setNewCatName("");
  };

  // Données réelles si disponibles, sinon mock de démonstration
  const review = txs || [
    { d: "29/04", lbl: "AMAZON EU SARL",         sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "low",  amt: -34.99 },
    { d: "28/04", lbl: "SALAIRE AVRIL",          sub: "VIR ENT — DUPONT SAS", cat: "inc",  conf: "high", amt: +2560.00 },
    { d: "27/04", lbl: "AUCHAN DRIVE",           sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -82.40 },
    { d: "26/04", lbl: "PRLV STORAGE BOX",       sub: "PRELEVEMENT SEPA",     cat: null,   conf: "none", amt: -12.00 },
    { d: "25/04", lbl: "RETRAIT DAB Lyon",       sub: "RETRAIT ESPECES",      cat: null,   conf: "none", amt: -60.00 },
    { d: "24/04", lbl: "SNCF INTERNET",          sub: "PAIEMENT PAR CARTE",   cat: "tra",  conf: "high", amt: -67.00 },
    { d: "23/04", lbl: "BOULANGERIE PICHON",     sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -8.40 },
    { d: "22/04", lbl: "NETFLIX.COM",            sub: "PAIEMENT PAR CARTE",   cat: "abo",  conf: "med",  amt: -13.49 },
    { d: "20/04", lbl: "DR. MARTIN J.",          sub: "VIREMENT SEPA",        cat: "san",  conf: "low",  amt: -55.00 },
    { d: "19/04", lbl: "MONOPRIX RUE DAMPIERRE", sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -42.10 },
    { d: "17/04", lbl: "LOYER AVRIL",            sub: "VIREMENT SEPA",        cat: "loy",  conf: "high", amt: -920.00 },
    { d: "15/04", lbl: "LE PETIT CAFÉ",          sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "high", amt: -14.20 },
    { d: "12/04", lbl: "TOTAL ÉNERGIES",         sub: "PAIEMENT PAR CARTE",   cat: "tra",  conf: "high", amt: -48.10 },
    { d: "10/04", lbl: "FNAC.COM",               sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "med",  amt: -29.90 },
  ];

  const withCat = review.map((t, i) => ({
    ...t,
    cat: catOverrides[i] !== undefined ? catOverrides[i] : t.cat,
  }));

  const noCat   = withCat.filter(t => !t.cat).length;
  const toCheck = withCat.filter(t => t.conf === "low" || t.conf === "none").length;

  const filtered = filter === "all" ? withCat
    : filter === "check" ? withCat.filter(t => t.conf === "low" || t.conf === "none")
    : withCat.filter(t => !t.cat);

  const totalDebit  = withCat.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0);
  const totalCredit = withCat.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);

  const catById = Object.fromEntries(categories.map(c => [c.id, c]));

  const displayName = fileName || "releve-bnp-avril-2026.pdf";
  const displaySize = fileSize ? fmtSize(fileSize) : "318 ko";

  return (
    <main className="ip-main">
      <style>{`
        .ip-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 14px; height: 100%; overflow: hidden;
                   background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
        .ip-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ip-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em;
                    text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .ip-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ip-bread .crumb-link { color: var(--ink-500); cursor: pointer; }
        .ip-bread .crumb-link:hover { color: var(--amber-500); }
        .ip-h1 { font-family: var(--font-display); font-size: 26px; font-weight: 400;
                 margin: 4px 0 0; color: var(--ink-900); letter-spacing: -0.01em; }
        .ip-h1 .file { font-family: var(--font-mono); font-size: 13px; color: var(--ink-500);
                       margin-left: 10px; font-style: normal; }
        .ip-tool { display: flex; gap: 8px; align-items: center; }
        .ip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px;
                  background: var(--cream-50); color: var(--ink-700);
                  font-size: 12px; cursor: pointer; }
        .ip-btn.amber { background: var(--amber-500); color: var(--cream-50);
                        border-color: var(--amber-500); font-weight: 500; }
        .ip-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        .ip-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .ip-stat { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 12px; padding: 14px 16px; }
        .ip-stat-l { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ip-stat-v { font-family: var(--font-display); font-size: 24px;
                     color: var(--ink-900); line-height: 1.1; margin-top: 6px; }
        .ip-stat-s { font-size: 11px; color: var(--ink-500); margin-top: 4px;
                     font-family: var(--font-mono); }

        .ip-cols { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px;
                   flex: 1; min-height: 0; }
        .ip-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px;
                   display: flex; flex-direction: column; min-height: 0; }
        .ip-card-h { padding: 16px 20px 12px;
                     display: flex; align-items: flex-start; justify-content: space-between;
                     border-bottom: 1px solid var(--line); }
        .ip-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .ip-tabs { display: flex; gap: 4px; }
        .ip-tab { padding: 5px 12px; border-radius: 7px; font-size: 11.5px;
                  color: var(--ink-600); background: transparent;
                  border: 1px solid transparent; cursor: pointer;
                  display: inline-flex; align-items: center; gap: 6px; }
        .ip-tab.active { background: var(--cream-200); color: var(--ink-800); }
        .ip-tab .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }
        .ip-tab.active .num { color: var(--amber-500); }
        .ip-tab.warn { color: var(--amber-500); }

        .ip-tbody { overflow: auto; flex: 1; }
        .ip-tr { display: grid; grid-template-columns: 28px 60px 1fr 180px 110px;
                 align-items: center; padding: 10px 20px;
                 border-bottom: 1px dashed var(--line);
                 position: relative; gap: 10px; }
        .ip-tr.review { background: rgba(184,105,61,0.04); }
        .ip-tr.review::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                                width: 2px; background: var(--amber-500); }
        .ip-tr.head { padding: 8px 20px; background: var(--cream-100);
                      border-bottom: 1px solid var(--line);
                      font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
                      color: var(--ink-500); }
        .ip-cb { width: 14px; height: 14px; border: 1.5px solid var(--line-strong);
                 border-radius: 3.5px; cursor: pointer; }
        .ip-cb.checked { background: var(--amber-500); border-color: var(--amber-500);
                         position: relative; }
        .ip-cb.checked::after { content: ""; position: absolute; left: 3px; top: 1px;
                                width: 4px; height: 7px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0;
                                transform: rotate(45deg); }
        .ip-date { font-family: var(--font-mono); font-size: 12px; color: var(--ink-500); }
        .ip-lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-sub { font-size: 10px; color: var(--ink-500); font-family: var(--font-mono);
                  margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }

        .ip-cat { display: inline-flex; align-items: center; gap: 6px;
                  padding: 4px 8px 4px 10px;
                  border: 1px dashed var(--line-strong); border-radius: 999px;
                  font-size: 11px; cursor: pointer; background: var(--cream-50);
                  position: relative; }
        .ip-cat.solid { border-style: solid; }
        .ip-cat-none { color: var(--amber-500); border-color: rgba(184,105,61,0.4);
                       background: var(--amber-100); }
        .ip-cat-conf { width: 5px; height: 5px; border-radius: 999px; }
        .conf-high { background: var(--sage-500); }
        .conf-med  { background: var(--amber-500); }
        .conf-low  { background: var(--rose-500); }
        .ip-cat-picker { position: absolute; top: calc(100% + 4px); left: 0; z-index: 20;
                         background: var(--cream-50); border: 1px solid var(--amber-500);
                         border-radius: 10px; padding: 6px; min-width: 160px;
                         box-shadow: 0 4px 14px var(--shadow-soft); }
        .ip-cat-picker-list { max-height: 168px; overflow-y: auto; }
        .ip-cat-picker-list > div { display: flex; align-items: center; gap: 8px; padding: 7px 10px;
                                    border-radius: 7px; cursor: pointer; font-size: 12px; }
        .ip-cat-picker-list > div:hover { background: var(--amber-100); }

        .ip-amt { font-family: var(--font-mono); font-size: 13px; text-align: right;
                  color: var(--ink-800); font-weight: 500; }
        .ip-amt.pos { color: var(--sage-500); }

        .ip-recap { display: flex; flex-direction: column; gap: 12px;
                    padding: 16px 20px; flex: 1; min-height: 0; overflow: auto; }
        .ip-recap-row { display: grid; grid-template-columns: 1fr auto auto;
                        align-items: center; gap: 10px;
                        padding: 8px 0; border-bottom: 1px dashed var(--line); }
        .ip-recap-row:last-child { border-bottom: none; }
        .ip-recap-l { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-800); }
        .ip-recap-c { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
        .ip-recap-a { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-800); font-weight: 500; }

        .ip-rule { padding: 14px; border-radius: 10px; background: var(--amber-100);
                   border: 1px solid rgba(184,105,61,0.25);
                   display: flex; gap: 12px; align-items: flex-start; }
        .ip-rule-ico { width: 28px; height: 28px; border-radius: 50%;
                       background: var(--cream-50);
                       display: flex; align-items: center; justify-content: center;
                       color: var(--amber-500); flex-shrink: 0; }
        .ip-rule-t { font-size: 12px; color: var(--ink-900); font-weight: 500; }
        .ip-rule-s { font-size: 11px; color: var(--ink-700); margin-top: 3px; line-height: 1.4; }
        .ip-rule-actions { display: flex; gap: 6px; margin-top: 8px; }

        @media (max-width: 768px) {
          .ip-main { padding: 14px 12px; overflow: auto; }
          .ip-top { flex-direction: column; align-items: flex-start; gap: 8px; }
          .ip-tool { flex-wrap: wrap; }
          .ip-stats { grid-template-columns: 1fr 1fr; }
          .ip-cols { grid-template-columns: 1fr; flex: none; min-height: 0; }
          /* Table de révision : scroll horizontal */
          .ip-tbody { overflow-x: auto; }
          .ip-tr { min-width: 480px; }
        }
      `}</style>

      <div className="ip-top">
        <div>
          <div className="ip-bread">
            <span className="crumb-link" onClick={onCancel}>Importer</span>
            <IcArrowR size={10}/>
            <strong>Aperçu</strong>
          </div>
          <h1 className="ip-h1">
            {displayName.replace(/\.[^.]+$/, "").replace(/-/g, " ").replace(/_/g, " ")}
            <span className="file">{displayName} · {displaySize}</span>
          </h1>
        </div>
        <div className="ip-tool">
          <button className="ip-btn ghost" onClick={onCancel}>Annuler</button>
          <button className="ip-btn amber" onClick={() => onConfirm(withCat)}>
            <IcArrowR size={14}/>Importer {review.length} transactions
          </button>
        </div>
      </div>

      {/* STATS — calculées depuis les vraies données */}
      <div className="ip-stats">
        <div className="ip-stat">
          <div className="ip-stat-l">Transactions détectées</div>
          <div className="ip-stat-v">{review.length}</div>
          <div className="ip-stat-s">dont {toCheck} à vérifier · {noCat} sans catégorie</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Période</div>
          <div className="ip-stat-v" style={{ fontSize: 18, paddingTop: 4 }}>
            {review[review.length - 1]?.d || "—"} → {review[0]?.d || "—"}
          </div>
          <div className="ip-stat-s">{review.length} lignes importées</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Total débits</div>
          <div className="ip-stat-v" style={{ color: "var(--rose-500)" }}>{fmtEUR(totalDebit, 2)}</div>
          <div className="ip-stat-s">{review.filter(t => t.amt < 0).length} mouvements</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Total crédits</div>
          <div className="ip-stat-v" style={{ color: "var(--sage-500)" }}>+{fmtEUR(Math.abs(totalCredit), 2)}</div>
          <div className="ip-stat-s">{review.filter(t => t.amt > 0).length} mouvements</div>
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="ip-cols">
        <div className="ip-card" style={{ position: "relative" }}>
          <div className="ip-card-h">
            <div>
              <div className="ip-card-t">Transactions extraites</div>
              <div className="ip-card-s">cliquez sur une catégorie pour la modifier</div>
            </div>
            <div className="ip-tabs">
              <button className={"ip-tab" + (filter === "all" ? " active" : "")}
                      onClick={() => setFilter("all")}>
                Tout <span className="num">{review.length}</span>
              </button>
              <button className={"ip-tab warn" + (filter === "check" ? " active" : "")}
                      onClick={() => setFilter("check")}>
                À vérifier <span className="num">{toCheck}</span>
              </button>
              <button className={"ip-tab" + (filter === "nocat" ? " active" : "")}
                      onClick={() => setFilter("nocat")}>
                Sans catégorie <span className="num">{noCat}</span>
              </button>
            </div>
          </div>
          <div className="ip-tr head">
            <span/>
            <span>Date</span>
            <span>Libellé</span>
            <span>Catégorie suggérée</span>
            <span style={{ textAlign: "right" }}>Montant</span>
          </div>
          <div className="ip-tbody" onClick={() => setCatPickerRow(null)}>
            {filtered.map((t, i) => {
              const origIdx = withCat.indexOf(t);
              const catInfo = t.cat ? (t.cat === "inc"
                ? { label: "Revenus", color: "var(--sage-500)" }
                : catById[t.cat] || null)
                : null;
              const isReview = t.conf === "low" || t.conf === "none";
              return (
                <div key={i} className={"ip-tr" + (isReview ? " review" : "")}>
                  <span className="ip-cb"/>
                  <span className="ip-date">{t.d}</span>
                  <div>
                    <div className="ip-lbl">{t.lbl}</div>
                    {t.sub && <div className="ip-sub">{t.sub}</div>}
                  </div>
                  <div style={{ position: "relative" }}>
                    {catInfo ? (
                      <span className="ip-cat solid"
                            style={{ borderColor: (catInfo.color || "#9d8b73") + "55",
                                     color: catInfo.color || "#9d8b73" }}
                            onClick={e => { e.stopPropagation(); setCatPickerRow(catPickerRow === origIdx ? null : origIdx); }}>
                        <span className={"ip-cat-conf conf-" + t.conf}/>
                        {catInfo.label}<IcChevDn size={10}/>
                      </span>
                    ) : (
                      <span className="ip-cat ip-cat-none"
                            onClick={e => { e.stopPropagation(); setCatPickerRow(catPickerRow === origIdx ? null : origIdx); }}>
                        <IcPlus size={10}/>Choisir<IcChevDn size={10}/>
                      </span>
                    )}
                    {catPickerRow === origIdx && (
                      <div className="ip-cat-picker" onClick={e => e.stopPropagation()}>
                        <div className="ip-cat-picker-list">
                          {categories.map(c => (
                            <div key={c.id}
                                 style={{ color: t.cat === c.id ? "var(--amber-500)" : "var(--ink-800)",
                                          background: t.cat === c.id ? "var(--amber-100)" : undefined }}
                                 onClick={() => {
                                   setCatOverrides(prev => ({ ...prev, [origIdx]: c.id }));
                                   setCatPickerRow(null); setNewCatForRow(null);
                                 }}>
                              <span className="amb-dot" style={{ background: c.color }}/>
                              {c.label}
                            </div>
                          ))}
                        </div>
                        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 4, marginTop: 4 }}>
                          {newCatForRow === origIdx ? (
                            <div onClick={e => e.stopPropagation()} style={{ padding: "4px 8px" }}>
                              <input autoFocus value={newCatName}
                                     onChange={e => setNewCatName(e.target.value)}
                                     onKeyDown={e => e.key === "Enter" && createAndAssignCat(origIdx)}
                                     placeholder="Nom de la catégorie…"
                                     style={{ width: "100%", boxSizing: "border-box", padding: "5px 8px",
                                              border: "1px solid var(--amber-500)", borderRadius: 6,
                                              fontSize: 12, background: "var(--cream-50)", outline: "none",
                                              color: "var(--ink-800)", marginBottom: 6 }}/>
                              <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                                {["#b8693d","#a85a48","#6b7a4f","#9d8b73","#cd8459","#3d2817","#7a5c3a"].map(c => (
                                  <span key={c} onClick={() => setNewCatColor(c)} style={{
                                    width: 14, height: 14, borderRadius: 3, background: c, cursor: "pointer",
                                    border: c === newCatColor ? "2px solid var(--ink-800)" : "2px solid transparent",
                                  }}/>
                                ))}
                              </div>
                              <button onClick={() => createAndAssignCat(origIdx)} style={{
                                width: "100%", padding: "5px 8px", borderRadius: 6, border: "none",
                                background: "var(--amber-500)", color: "var(--cream-50)",
                                fontSize: 11, cursor: "pointer", fontWeight: 500,
                              }}>Créer</button>
                            </div>
                          ) : (
                            <div onClick={() => { setNewCatForRow(origIdx); setNewCatName(""); }}
                                 style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 10px",
                                          cursor: "pointer", fontSize: 11.5, color: "var(--amber-500)" }}>
                              <IcPlus size={10}/> Nouvelle catégorie…
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <span className={"ip-amt" + (t.amt > 0 ? " pos" : "")}>
                    {t.amt > 0 ? "+" : ""}{fmtEUR(t.amt, 2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ip-card">
          <div className="ip-card-h">
            <div>
              <div className="ip-card-t">Récapitulatif</div>
              <div className="ip-card-s">par catégorie suggérée</div>
            </div>
          </div>
          <div className="ip-recap">
            {categories.map(c => {
              const rows = withCat.filter(t => t.cat === c.id);
              if (rows.length === 0) return null;
              const sum = rows.reduce((s, t) => s + Math.abs(t.amt), 0);
              return (
                <div key={c.id} className="ip-recap-row">
                  <span className="ip-recap-l">
                    <span className="amb-dot" style={{ background: c.color }}/>
                    {c.label}
                  </span>
                  <span className="ip-recap-c">{rows.length} tx</span>
                  <span className="ip-recap-a">{fmtEUR(sum, 0)}</span>
                </div>
              );
            })}
            {noCat > 0 && (
              <div className="ip-recap-row">
                <span className="ip-recap-l" style={{ color: "var(--amber-500)" }}>
                  <span className="amb-dot" style={{ background: "var(--amber-500)" }}/>
                  Sans catégorie
                </span>
                <span className="ip-recap-c">{noCat} tx</span>
                <span className="ip-recap-a">
                  {fmtEUR(withCat.filter(t => !t.cat).reduce((s, t) => s + Math.abs(t.amt), 0), 0)}
                </span>
              </div>
            )}

            {!ruleDismissed && (
              <div className="ip-rule">
                <div className="ip-rule-ico">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
                  </svg>
                </div>
                <div>
                  <div className="ip-rule-t">Créer des règles automatiques ?</div>
                  <div className="ip-rule-s">
                    Ambre peut mémoriser les libellés récurrents pour classer
                    automatiquement vos prochains relevés.
                  </div>
                  <div className="ip-rule-actions">
                    <button className="ip-btn" style={{ padding: "5px 12px", fontSize: 11 }}
                            onClick={() => setRuleDismissed(true)}>Plus tard</button>
                    <button className="ip-btn amber" style={{ padding: "5px 12px", fontSize: 11 }}
                            onClick={() => setRulesModalOpen(true)}>Configurer</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)",
                        display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--sage-500)" }}>
            <IcLock size={11}/>
            Aucune donnée n'a quitté votre appareil.
          </div>
        </div>
      </div>

      {rulesModalOpen && (
        <RulesConfigModal
          txs={withCat}
          existingRules={autoRules}
          onSave={newRules => {
            setAutoRules(newRules);
            setRulesModalOpen(false);
            setRuleDismissed(true);
          }}
          onClose={() => setRulesModalOpen(false)}
        />
      )}
    </main>
  );
}

