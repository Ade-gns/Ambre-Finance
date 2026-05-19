/* Écran Import — workflow complet en 4 états
   1. empty   — drop zone + historique + sources
   2. preview — table éditable des transactions extraites
   3. success — confirmation et prochaines étapes
   4. error   — erreur de lecture + cas fréquents

   Pour le moment, le passage d'un état à l'autre se fait via des boutons (mocks).
   Plus tard, les vraies transitions seront déclenchées par le backend Tauri/Rust. */

import { useState } from "react";
import { CATEGORIES } from "../data/mockData";
import { fmtEUR } from "../lib/chartPrimitives";
import {
  IcCalendar, IcSearch, IcUpload, IcLock, IcArrowR, IcChevDn,
  IcPlus, IcHome, IcList, IcImport, IcTag, IcBell
} from "../lib/icons";

export default function Import() {
  const [state, setState] = useState("empty"); // empty | preview | success | error

  return (
    <>
      {/* Barre de contrôle "demo" — visible en haut, permet de tester les 4 états.
          À retirer quand le vrai workflow sera branché sur le backend. */}
      <DemoStateSwitcher current={state} onChange={setState} />

      {state === "empty"   && <ImportEmpty   onPick={() => setState("preview")}
                                              onError={() => setState("error")} />}
      {state === "preview" && <ImportPreview onConfirm={() => setState("success")}
                                              onCancel={() => setState("empty")} />}
      {state === "success" && <ImportSuccess onAgain={() => setState("empty")} />}
      {state === "error"   && <ImportError   onRetry={() => setState("empty")} />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Barre de switch entre les 4 états (mode démo)
   ───────────────────────────────────────────────────────────────── */
function DemoStateSwitcher({ current, onChange }) {
  const states = [
    { key: "empty",   label: "1. Vide" },
    { key: "preview", label: "2. Aperçu" },
    { key: "success", label: "3. Succès" },
    { key: "error",   label: "4. Erreur" },
  ];
  return (
    <div style={{
      position: "fixed", top: 8, right: 16, zIndex: 100,
      display: "flex", gap: 4,
      padding: 4,
      background: "rgba(255,255,255,0.9)",
      backdropFilter: "blur(8px)",
      border: "1px solid var(--line)",
      borderRadius: 8,
      fontSize: 11,
    }}>
      <span style={{ padding: "4px 8px", color: "var(--ink-500)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
        Démo
      </span>
      {states.map(s => (
        <button key={s.key} onClick={() => onChange(s.key)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 5,
                  fontSize: 11,
                  background: current === s.key ? "var(--amber-500)" : "transparent",
                  color: current === s.key ? "var(--cream-50)" : "var(--ink-700)",
                  border: "none",
                  cursor: "pointer",
                }}>
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   1. État vide — drop zone + historique + sources reconnues
   ───────────────────────────────────────────────────────────────── */
function ImportEmpty({ onPick, onError }) {
  const sources = [
    { name: "BNP Paribas",            fmt: "PDF, CSV", last: "Avril 2026", status: "ok" },
    { name: "La Banque Postale",      fmt: "PDF, CSV", last: "Mars 2026",  status: "ok" },
    { name: "Crédit Agricole",        fmt: "PDF, OFX", last: "Jamais",     status: "new" },
    { name: "Boursorama",             fmt: "CSV, OFX", last: "Jamais",     status: "new" },
    { name: "Revolut",                fmt: "CSV",      last: "Jamais",     status: "new" },
    { name: "Autre — CSV générique",  fmt: "CSV",      last: null,         status: "generic" },
  ];

  const history = [
    { file: "releve-bnp-avril-2026.pdf", date: "12 mai · 10h32",  tx: 47, period: "01 – 30 avril",   size: "318 ko" },
    { file: "lbp-mars-2026.csv",         date: "08 avril · 19h12", tx: 42, period: "01 – 31 mars",    size: "12 ko"  },
    { file: "releve-bnp-mars-2026.pdf",  date: "06 avril · 22h04", tx: 39, period: "01 – 31 mars",    size: "291 ko" },
    { file: "lbp-fevrier-2026.csv",      date: "08 mars · 18h44",  tx: 36, period: "01 – 28 février", size: "11 ko"  },
  ];

  return (
    <main className="ie-main">
      <style>{`
        .ie-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 16px; height: 100%; overflow: auto;
                   background: #efe7d6; color: var(--ink-800); font-size: 13px; }
        .ie-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ie-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ie-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ie-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400;
                 margin: 4px 0 0; color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-h1 em { font-style: italic; color: var(--amber-500); }
        .ie-tool { display: flex; gap: 8px; align-items: center; }
        .ie-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px;
                  background: var(--cream-50); color: var(--ink-700); font-size: 12px;
                  cursor: pointer; }
        .ie-btn.amber { background: var(--amber-500); color: var(--cream-50);
                        border-color: var(--amber-500); font-weight: 500; }

        .ie-drop { background: var(--cream-50);
                   border: 1.5px dashed rgba(184,105,61,0.45);
                   border-radius: 14px; padding: 40px 28px;
                   display: flex; flex-direction: column; align-items: center; gap: 14px;
                   position: relative; overflow: hidden; }
        .ie-drop::before { content: ""; position: absolute; inset: 0;
                           background-image: repeating-linear-gradient(45deg, transparent 0 14px, rgba(184,105,61,0.025) 14px 16px);
                           pointer-events: none; }
        .ie-drop > * { position: relative; z-index: 1; }
        .ie-drop-ico { width: 60px; height: 60px; border-radius: 16px;
                       background: var(--amber-100); color: var(--amber-500);
                       display: flex; align-items: center; justify-content: center; }
        .ie-drop-t { font-family: var(--font-display); font-size: 26px;
                     color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-drop-s { font-size: 13px; color: var(--ink-600); text-align: center; max-width: 480px; }
        .ie-drop-actions { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
        .ie-drop-formats { display: flex; gap: 8px; margin-top: 6px; }
        .ie-fmt-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                       border-radius: 999px; background: var(--cream-200);
                       font-size: 11px; color: var(--ink-700); font-family: var(--font-mono); }
        .ie-trust { display: flex; align-items: center; gap: 6px; font-size: 11px;
                    color: var(--sage-500);
                    padding-top: 6px; border-top: 1px dashed var(--line); }

        .ie-cols { display: grid; grid-template-columns: 1fr 1.05fr; gap: 14px;
                   flex: 1; min-height: 0; }
        .ie-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px; padding: 18px 20px;
                   display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        .ie-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
        .ie-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ie-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .ie-src-list { display: flex; flex-direction: column; }
        .ie-src-row { display: grid; grid-template-columns: 28px 1fr auto auto;
                      align-items: center; gap: 10px;
                      padding: 10px 0; border-bottom: 1px dashed var(--line); }
        .ie-src-row:last-child { border-bottom: none; }
        .ie-src-mark { width: 28px; height: 28px; border-radius: 7px;
                       background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center;
                       font-family: var(--font-display); font-style: italic;
                       font-size: 15px; color: var(--ink-700); }
        .ie-src-name { font-size: 13px; color: var(--ink-800); }
        .ie-src-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px;
                       font-family: var(--font-mono); }
        .ie-src-last { font-size: 11px; color: var(--ink-500); }
        .ie-src-status { font-size: 10px; padding: 2px 8px; border-radius: 999px;
                         border: 1px solid var(--line); color: var(--ink-600); }
        .ie-src-status.ok { background: rgba(107,122,79,0.10); border-color: rgba(107,122,79,0.35); color: var(--sage-500); }
        .ie-src-status.new { background: var(--amber-100); border-color: rgba(184,105,61,0.35); color: var(--amber-500); }

        .ie-hist-row { display: grid; grid-template-columns: 32px 1fr auto auto; gap: 12px;
                       align-items: center; padding: 12px 0;
                       border-bottom: 1px dashed var(--line); }
        .ie-hist-row:last-child { border-bottom: none; }
        .ie-hist-ico { width: 32px; height: 32px; border-radius: 8px; background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center; color: var(--ink-600); }
        .ie-hist-file { font-size: 12.5px; color: var(--ink-800); font-family: var(--font-mono); }
        .ie-hist-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
        .ie-hist-tx { display: inline-flex; align-items: center; gap: 4px;
                      padding: 3px 8px; border-radius: 999px;
                      background: var(--amber-100); color: var(--amber-500);
                      font-size: 11px; font-weight: 500; }
        .ie-hist-act { display: flex; gap: 6px; }
        .ie-hist-act > button { width: 26px; height: 26px; padding: 0; }
      `}</style>

      <div className="ie-top">
        <div>
          <div className="ie-bread">Ambre · <strong>Importer un relevé</strong></div>
          <h1 className="ie-h1">Ajouter un <em>relevé</em>.</h1>
        </div>
        <div className="ie-tool">
          <button className="ie-btn"><IcCalendar size={14}/>Historique complet</button>
          <button className="ie-btn"><IcSearch size={14}/></button>
        </div>
      </div>

      {/* DROP ZONE */}
      <div className="ie-drop">
        <div className="ie-drop-ico">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4h10l5 5v18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
            <path d="M19 4v5h5"/>
            <path d="M16 22V14"/>
            <path d="M12 18l4-4 4 4"/>
          </svg>
        </div>
        <div className="ie-drop-t">Glissez un relevé ici</div>
        <div className="ie-drop-s">
          Ambre lit les relevés PDF de la plupart des banques françaises et les fichiers CSV
          génériques. Les transactions sont extraites et pré-classées automatiquement.
        </div>
        <div className="ie-drop-actions">
          <button className="ie-btn amber" style={{ padding: "9px 16px", fontSize: 13 }} onClick={onPick}>
            <IcUpload size={14}/>Parcourir mes fichiers
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-500)" }}>ou faites glisser le fichier</span>
        </div>
        <div className="ie-drop-formats">
          <span className="ie-fmt-chip">.pdf</span>
          <span className="ie-fmt-chip">.csv</span>
          <span className="ie-fmt-chip">.ofx</span>
          <span className="ie-fmt-chip">.qif</span>
        </div>
        <div className="ie-trust">
          <IcLock size={11}/>
          Lecture 100 % locale · aucun fichier n'est transmis ni stocké en ligne
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="ie-cols">
        {/* SOURCES */}
        <div className="ie-card">
          <div className="ie-card-h">
            <div>
              <div className="ie-card-t">Sources reconnues</div>
              <div className="ie-card-s">6 formats pris en charge · ajoutez les vôtres dans Paramètres</div>
            </div>
            <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11 }}>
              <IcPlus size={11}/>Ajouter
            </button>
          </div>
          <div className="ie-src-list">
            {sources.map(s => (
              <div key={s.name} className="ie-src-row">
                <div className="ie-src-mark">{s.name[0].toLowerCase()}</div>
                <div>
                  <div className="ie-src-name">{s.name}</div>
                  <div className="ie-src-meta">{s.fmt}</div>
                </div>
                <div className="ie-src-last">{s.last || "—"}</div>
                <div className={"ie-src-status " + s.status}>
                  {s.status === "ok" ? "Configurée" : s.status === "new" ? "À configurer" : "Manuel"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        <div className="ie-card" style={{ overflow: "hidden" }}>
          <div className="ie-card-h">
            <div>
              <div className="ie-card-t">Imports récents</div>
              <div className="ie-card-s">4 fichiers · 164 transactions importées</div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11,
                       background: "var(--amber-100)", color: "var(--amber-500)",
                       borderColor: "rgba(184,105,61,0.3)" }}>Tous</button>
              <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11 }}>PDF</button>
              <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11 }}>CSV</button>
            </div>
          </div>
          <div style={{ overflow: "hidden" }}>
            {history.map(h => (
              <div key={h.file} className="ie-hist-row">
                <div className="ie-hist-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div>
                  <div className="ie-hist-file">{h.file}</div>
                  <div className="ie-hist-meta">{h.date} · {h.period} · {h.size}</div>
                </div>
                <span className="ie-hist-tx">{h.tx} tx</span>
                <div className="ie-hist-act">
                  <button className="ie-btn" title="Revoir"><IcSearch size={12}/></button>
                  <button className="ie-btn" title="Supprimer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   2. Aperçu — table éditable + récap + règle suggérée
   ───────────────────────────────────────────────────────────────── */
function ImportPreview({ onConfirm, onCancel }) {
  const review = [
    { d: "29/04", lbl: "AMAZON EU SARL",         sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "low",  amt: -34.99 },
    { d: "28/04", lbl: "SALAIRE AVRIL",          sub: "VIR ENT — DUPONT SAS", cat: "inc",  conf: "high", amt: +2560.00 },
    { d: "27/04", lbl: "AUCHAN DRIVE",           sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -82.40 },
    { d: "26/04", lbl: "PRLV STORAGE BOX",       sub: "PRELEVEMENT SEPA",     cat: null,   conf: "none", amt: -12.00 },
    { d: "25/04", lbl: "RETRAIT DAB Lyon Part-Dieu", sub: "RETRAIT ESPECES",  cat: null,   conf: "none", amt: -60.00 },
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

  const recap = [
    { id: "loy",  label: "Logement",     color: "#3d2817", count: 1,  sum: 920.00 },
    { id: "alim", label: "Alimentation", color: "#b8693d", count: 14, sum: 432.60 },
    { id: "tra",  label: "Transports",   color: "#6b7a4f", count: 5,  sum: 167.80 },
    { id: "abo",  label: "Abonnements",  color: "#cd8459", count: 4,  sum: 54.99 },
    { id: "loi",  label: "Loisirs",      color: "#a85a48", count: 8,  sum: 142.30 },
    { id: "san",  label: "Santé",        color: "#9d8b73", count: 2,  sum: 77.50 },
  ];

  const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  return (
    <main className="ip-main">
      <style>{`
        .ip-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 14px; height: 100%; overflow: hidden;
                   background: #efe7d6; color: var(--ink-800); font-size: 13px; }
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
        .ip-cb.checked::after { content: ""; position: absolute; left: 3px; top: 0px;
                                width: 4px; height: 8px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0;
                                transform: rotate(45deg); }
        .ip-date { font-family: var(--font-mono); font-size: 12px; color: var(--ink-500); }
        .ip-lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-sub { font-size: 10px; color: var(--ink-500); font-family: var(--font-mono);
                  margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }

        .ip-cat { display: inline-flex; align-items: center; gap: 6px;
                  padding: 4px 8px 4px 10px;
                  border: 1px dashed var(--line-strong); border-radius: 999px;
                  font-size: 11px; cursor: pointer; background: var(--cream-50); }
        .ip-cat.solid { border-style: solid; }
        .ip-cat-none { color: var(--amber-500); border-color: rgba(184,105,61,0.4);
                       background: var(--amber-100); }
        .ip-cat-conf { width: 5px; height: 5px; border-radius: 999px; }
        .conf-high { background: var(--sage-500); }
        .conf-med  { background: var(--amber-500); }
        .conf-low  { background: var(--rose-500); }

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
      `}</style>

      <div className="ip-top">
        <div>
          <div className="ip-bread">
            <span className="crumb-link">Importer</span>
            <IcArrowR size={10}/>
            <strong>Aperçu</strong>
          </div>
          <h1 className="ip-h1">
            Relevé BNP Paribas — avril 2026
            <span className="file">releve-bnp-avril-2026.pdf · 318 ko</span>
          </h1>
        </div>
        <div className="ip-tool">
          <button className="ip-btn ghost" onClick={onCancel}>Annuler</button>
          <button className="ip-btn"><IcSearch size={14}/>Aperçu du PDF</button>
          <button className="ip-btn amber" onClick={onConfirm}>
            <IcArrowR size={14}/>Importer 47 transactions
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="ip-stats">
        <div className="ip-stat">
          <div className="ip-stat-l">Transactions détectées</div>
          <div className="ip-stat-v">47</div>
          <div className="ip-stat-s">dont 6 à vérifier · 2 sans catégorie</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Période</div>
          <div className="ip-stat-v">01 – 30 avr.</div>
          <div className="ip-stat-s">30 jours · sans doublon avec mars</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Total débits</div>
          <div className="ip-stat-v" style={{ color: "var(--rose-500)" }}>−1 695,00 €</div>
          <div className="ip-stat-s">42 mouvements</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Total crédits</div>
          <div className="ip-stat-v" style={{ color: "var(--sage-500)" }}>+2 560,00 €</div>
          <div className="ip-stat-s">5 mouvements</div>
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="ip-cols">
        <div className="ip-card">
          <div className="ip-card-h">
            <div>
              <div className="ip-card-t">Transactions extraites</div>
              <div className="ip-card-s">cliquez sur une catégorie pour la modifier</div>
            </div>
            <div className="ip-tabs">
              <button className="ip-tab active">Tout <span className="num">47</span></button>
              <button className="ip-tab warn">À vérifier <span className="num">6</span></button>
              <button className="ip-tab">Sans catégorie <span className="num">2</span></button>
            </div>
          </div>
          <div className="ip-tr head">
            <span/>
            <span>Date</span>
            <span>Libellé</span>
            <span>Catégorie suggérée</span>
            <span style={{ textAlign: "right" }}>Montant</span>
          </div>
          <div className="ip-tbody">
            {review.map((t, i) => {
              const cat = t.cat ? catById[t.cat] : null;
              const isReview = t.conf === "low" || t.conf === "none";
              return (
                <div key={i} className={"ip-tr" + (isReview ? " review" : "")}>
                  <span className={"ip-cb" + (i % 5 === 0 ? " checked" : "")}/>
                  <span className="ip-date">{t.d}</span>
                  <div>
                    <div className="ip-lbl">{t.lbl}</div>
                    <div className="ip-sub">{t.sub}</div>
                  </div>
                  <div>
                    {t.cat === "inc" ? (
                      <span className="ip-cat solid" style={{ borderColor: "rgba(107,122,79,0.4)", color: "var(--sage-500)" }}>
                        <span className="ip-cat-conf conf-high"/>Revenus<IcChevDn size={10}/>
                      </span>
                    ) : cat ? (
                      <span className="ip-cat solid" style={{ borderColor: cat.color + "55", color: cat.color }}>
                        <span className={"ip-cat-conf conf-" + t.conf}/>
                        {cat.label}<IcChevDn size={10}/>
                      </span>
                    ) : (
                      <span className="ip-cat ip-cat-none">
                        <IcPlus size={10}/>Choisir<IcChevDn size={10}/>
                      </span>
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
            <span className="amb-chip" style={{ color: "var(--sage-500)",
                  borderColor: "rgba(107,122,79,0.35)", background: "rgba(107,122,79,0.08)" }}>
              <span className="amb-dot" style={{ background: "var(--sage-500)" }}/>
              87 % de confiance
            </span>
          </div>
          <div className="ip-recap">
            {recap.map(r => (
              <div key={r.id} className="ip-recap-row">
                <span className="ip-recap-l">
                  <span className="amb-dot" style={{ background: r.color }}/>
                  {r.label}
                </span>
                <span className="ip-recap-c">{r.count} tx</span>
                <span className="ip-recap-a">{fmtEUR(r.sum, 0)}</span>
              </div>
            ))}
            <div className="ip-recap-row">
              <span className="ip-recap-l" style={{ color: "var(--amber-500)" }}>
                <span className="amb-dot" style={{ background: "var(--amber-500)" }}/>
                Sans catégorie
              </span>
              <span className="ip-recap-c">2 tx</span>
              <span className="ip-recap-a">{fmtEUR(72, 0)}</span>
            </div>

            <div className="ip-rule">
              <div className="ip-rule-ico">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
                </svg>
              </div>
              <div>
                <div className="ip-rule-t">Créer une règle pour Netflix.com ?</div>
                <div className="ip-rule-s">
                  Toutes les transactions contenant « NETFLIX » seront classées en
                  <strong style={{ color: "var(--ink-900)" }}> Abonnements</strong> à l'avenir.
                </div>
                <div className="ip-rule-actions">
                  <button className="ip-btn" style={{ padding: "5px 12px", fontSize: 11, background: "var(--cream-50)" }}>Plus tard</button>
                  <button className="ip-btn amber" style={{ padding: "5px 12px", fontSize: 11 }}>Créer la règle</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)",
                        display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--sage-500)" }}>
            <IcLock size={11}/>
            Aucune donnée n'a quitté votre appareil.
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   3. Succès — confirmation + récap + prochaines étapes
   ───────────────────────────────────────────────────────────────── */
function ImportSuccess({ onAgain }) {
  const recap = [
    { id: "loy",  label: "Logement",     color: "#3d2817", count: 1,  sum: 920.00 },
    { id: "alim", label: "Alimentation", color: "#b8693d", count: 14, sum: 432.60 },
    { id: "tra",  label: "Transports",   color: "#6b7a4f", count: 5,  sum: 167.80 },
    { id: "loi",  label: "Loisirs",      color: "#a85a48", count: 8,  sum: 142.30 },
    { id: "abo",  label: "Abonnements",  color: "#cd8459", count: 4,  sum: 54.99 },
    { id: "san",  label: "Santé",        color: "#9d8b73", count: 2,  sum: 77.50 },
  ];

  return (
    <main className="su-main">
      <style>{`
        .su-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 18px; height: 100%; overflow: auto;
                   background: #efe7d6; color: var(--ink-800); font-size: 13px; }
        .su-bread { font-size: 11px; color: var(--ink-500);
                    letter-spacing: 0.06em; text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .su-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }

        .su-hero { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 16px; padding: 48px 56px;
                   display: grid; grid-template-columns: 100px 1fr auto;
                   gap: 32px; align-items: center; position: relative; overflow: hidden; }
        .su-hero::before { content: ""; position: absolute; inset: 0; opacity: 0.5;
                           background-image: radial-gradient(circle at 90% 50%, rgba(107,122,79,0.08), transparent 60%); }
        .su-hero > * { position: relative; z-index: 1; }
        .su-check { width: 80px; height: 80px; border-radius: 50%;
                    background: linear-gradient(135deg, #9aaa7d, #6b7a4f);
                    color: var(--cream-50);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 20px rgba(107,122,79,0.25); }
        .su-hero-l { font-size: 11px; color: var(--sage-500);
                     letter-spacing: 0.1em; text-transform: uppercase;
                     display: flex; align-items: center; gap: 8px; }
        .su-hero-h { font-family: var(--font-display); font-size: 44px; line-height: 1.05;
                     color: var(--ink-900); letter-spacing: -0.02em;
                     margin: 6px 0 4px; font-weight: 400; }
        .su-hero-h em { font-style: italic; color: var(--sage-500); }
        .su-hero-s { font-size: 14px; color: var(--ink-600); line-height: 1.5; max-width: 540px; }
        .su-hero-meta { display: flex; gap: 16px; margin-top: 12px;
                        font-size: 11px; color: var(--ink-500); }
        .su-hero-meta strong { color: var(--ink-800); font-family: var(--font-mono); font-weight: 500; }

        .su-hero-actions { display: flex; flex-direction: column; gap: 8px;
                           align-items: stretch; min-width: 220px; }
        .su-btn { display: inline-flex; align-items: center; gap: 8px;
                  padding: 10px 16px; border: 1px solid var(--line);
                  border-radius: 9px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 13px;
                  justify-content: center; cursor: pointer; }
        .su-btn.primary { background: var(--ink-800); color: var(--cream-50);
                          border-color: var(--ink-800); font-weight: 500; }
        .su-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        .su-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .su-stat { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 12px; padding: 14px 18px;
                   display: flex; flex-direction: column; gap: 4px; }
        .su-stat-l { font-size: 10px; color: var(--ink-500);
                     letter-spacing: 0.08em; text-transform: uppercase; }
        .su-stat-v { font-family: var(--font-display); font-size: 26px;
                     color: var(--ink-900); line-height: 1.1; margin-top: 4px; }
        .su-stat-s { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }

        .su-bot { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px;
                  flex: 1; min-height: 0; }
        .su-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px;
                   display: flex; flex-direction: column; overflow: hidden; }
        .su-card-h { padding: 16px 20px 12px; border-bottom: 1px solid var(--line);
                     display: flex; align-items: flex-start; justify-content: space-between; }
        .su-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .su-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .su-recap-list { padding: 8px 20px; overflow: auto; }
        .su-recap-row { display: grid; grid-template-columns: 1fr 70px 90px;
                        align-items: center; gap: 10px; padding: 9px 0;
                        border-bottom: 1px dashed var(--line); }
        .su-recap-row:last-child { border-bottom: none; }
        .su-recap-l { display: flex; align-items: center; gap: 8px;
                      font-size: 13px; color: var(--ink-800); }
        .su-recap-c { font-family: var(--font-mono); font-size: 11px;
                      color: var(--ink-500); text-align: right; }
        .su-recap-a { font-family: var(--font-mono); font-size: 12.5px;
                      color: var(--ink-800); font-weight: 500; text-align: right; }

        .su-next { padding: 18px 22px; display: flex; flex-direction: column; gap: 10px; }
        .su-next-item { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px;
                        align-items: center; padding: 12px; border-radius: 10px;
                        cursor: pointer; background: var(--cream-100);
                        border: 1px solid var(--line); }
        .su-next-item:hover { border-color: var(--amber-500); }
        .su-next-item.primary { background: var(--amber-100); border-color: rgba(184,105,61,0.3); }
        .su-next-ico { width: 36px; height: 36px; border-radius: 9px;
                       background: var(--cream-50);
                       display: flex; align-items: center; justify-content: center;
                       color: var(--amber-500); }
        .su-next-t { font-size: 13px; color: var(--ink-900); font-weight: 500; }
        .su-next-s { font-size: 11px; color: var(--ink-600); margin-top: 2px; }

        .su-reassure { display: flex; align-items: center; gap: 8px;
                       padding: 10px 14px; background: var(--cream-100);
                       border-radius: 8px;
                       font-size: 11.5px; color: var(--sage-500); margin-top: auto; }
      `}</style>

      <div className="su-bread">
        <span>Importer</span>
        <IcArrowR size={10}/>
        <span>Aperçu</span>
        <IcArrowR size={10}/>
        <strong>Succès</strong>
      </div>

      {/* HERO */}
      <div className="su-hero">
        <div className="su-check">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5.5 5.5L20 7"/>
          </svg>
        </div>
        <div>
          <div className="su-hero-l">
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-500)" }}/>
            Import terminé
          </div>
          <h2 className="su-hero-h">
            47 transactions ajoutées<br/>
            <em>à votre journal.</em>
          </h2>
          <p className="su-hero-s">
            Le relevé d'avril 2026 a été lu et classé. Vous pouvez modifier la catégorie
            de n'importe quelle transaction à tout moment depuis la liste.
          </p>
          <div className="su-hero-meta">
            <span>Fichier · <strong>releve-bnp-avril-2026.pdf</strong></span>
            <span>Période · <strong>01 – 30 avril</strong></span>
            <span>Durée · <strong>2,4 s</strong></span>
          </div>
        </div>
        <div className="su-hero-actions">
          <button className="su-btn primary"><IcList size={14}/>Voir mes transactions</button>
          <button className="su-btn"><IcHome size={14}/>Retour au tableau</button>
          <button className="su-btn ghost" onClick={onAgain}>↺ Annuler cet import</button>
        </div>
      </div>

      {/* STATS */}
      <div className="su-stats">
        <div className="su-stat">
          <div className="su-stat-l">Transactions ajoutées</div>
          <div className="su-stat-v">47</div>
          <div className="su-stat-s">0 doublon · 0 ignorée</div>
        </div>
        <div className="su-stat">
          <div className="su-stat-l">Catégorisées auto.</div>
          <div className="su-stat-v" style={{ color: "var(--sage-500)" }}>
            41 <span style={{ fontSize: 14, color: "var(--ink-500)" }}>/ 47</span>
          </div>
          <div className="su-stat-s">87 % · 6 à vérifier</div>
        </div>
        <div className="su-stat">
          <div className="su-stat-l">Total débits</div>
          <div className="su-stat-v" style={{ color: "var(--rose-500)" }}>−1 695 €</div>
          <div className="su-stat-s">42 mouvements</div>
        </div>
        <div className="su-stat">
          <div className="su-stat-l">Total crédits</div>
          <div className="su-stat-v" style={{ color: "var(--sage-500)" }}>+2 560 €</div>
          <div className="su-stat-s">5 mouvements</div>
        </div>
      </div>

      <div className="su-bot">
        <div className="su-card">
          <div className="su-card-h">
            <div>
              <div className="su-card-t">Récapitulatif par catégorie</div>
              <div className="su-card-s">comparaison avec mars 2026 entre parenthèses</div>
            </div>
            <button className="su-btn" style={{ padding: "4px 10px", fontSize: 11 }}>
              Voir le détail <IcArrowR size={11}/>
            </button>
          </div>
          <div className="su-recap-list">
            {recap.map(r => (
              <div key={r.id} className="su-recap-row">
                <span className="su-recap-l">
                  <span className="amb-dot" style={{ background: r.color }}/>
                  {r.label}
                </span>
                <span className="su-recap-c">{r.count} tx</span>
                <span className="su-recap-a">{fmtEUR(r.sum, 0)}</span>
              </div>
            ))}
            <div className="su-recap-row" style={{ paddingTop: 12, marginTop: 4, borderTop: "1px solid var(--line)" }}>
              <span className="su-recap-l" style={{ fontWeight: 500 }}>Total avril 2026</span>
              <span className="su-recap-c">42 tx</span>
              <span className="su-recap-a" style={{ color: "var(--rose-500)" }}>{fmtEUR(1695, 0)}</span>
            </div>
          </div>
        </div>

        <div className="su-card">
          <div className="su-card-h">
            <div>
              <div className="su-card-t">Et maintenant ?</div>
              <div className="su-card-s">trois pistes pour démarrer</div>
            </div>
          </div>
          <div className="su-next">
            <div className="su-next-item primary">
              <div className="su-next-ico"><IcBell size={16}/></div>
              <div>
                <div className="su-next-t">6 transactions à vérifier</div>
                <div className="su-next-s">Ambre n'était pas sûr du classement — un rapide coup d'œil suffira.</div>
              </div>
              <IcArrowR size={14} style={{ color: "var(--amber-500)" }}/>
            </div>
            <div className="su-next-item" onClick={onAgain}>
              <div className="su-next-ico"><IcImport size={16}/></div>
              <div>
                <div className="su-next-t">Importer un autre relevé</div>
                <div className="su-next-s">Pour comparer avec mars 2026 et affiner les tendances.</div>
              </div>
              <IcArrowR size={14} style={{ color: "var(--ink-500)" }}/>
            </div>
            <div className="su-next-item">
              <div className="su-next-ico"><IcTag size={16}/></div>
              <div>
                <div className="su-next-t">Créer des règles pour les récurrentes</div>
                <div className="su-next-s">4 abonnements détectés — automatiser leur classement.</div>
              </div>
              <IcArrowR size={14} style={{ color: "var(--ink-500)" }}/>
            </div>

            <div className="su-reassure">
              <IcLock size={11}/>
              Aucune donnée n'a quitté votre appareil pendant cet import.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   4. Erreur — message principal + détails + cas fréquents
   ───────────────────────────────────────────────────────────────── */
function ImportError({ onRetry }) {
  const otherCases = [
    {
      kind: "duplicate",
      title: "12 transactions déjà importées",
      sub: "releve-bnp-avril-2026.pdf",
      desc: "Vous avez importé un relevé qui chevauche partiellement mars 2026. Les doublons ont été détectés grâce à leur date + montant + libellé.",
      tone: "warn",
    },
    {
      kind: "corrupted",
      title: "Fichier corrompu ou protégé",
      sub: "relevé-2026-protégé.pdf",
      desc: "Le PDF est verrouillé par mot de passe ou les pages ne peuvent pas être lues. Décochez la protection dans votre navigateur de PDF puis réessayez.",
      tone: "danger",
    },
  ];

  return (
    <main className="ier-main">
      <style>{`
        .ier-main { padding: 22px 28px; display: flex; flex-direction: column;
                    gap: 16px; height: 100%; overflow: auto;
                    background: #efe7d6; color: var(--ink-800); font-size: 13px; }
        .ier-bread { font-size: 11px; color: var(--ink-500);
                     letter-spacing: 0.06em; text-transform: uppercase;
                     display: flex; align-items: center; gap: 6px; }
        .ier-bread .err { color: var(--rose-500); font-weight: 500;
                          letter-spacing: 0; text-transform: none; }

        .ier-hero { background: var(--cream-50); border: 1px solid var(--line);
                    border-radius: 16px; padding: 40px 44px;
                    display: grid; grid-template-columns: 80px 1fr 220px;
                    gap: 28px; align-items: flex-start;
                    position: relative; overflow: hidden; }
        .ier-hero::before { content: ""; position: absolute; inset: 0;
                            background-image: radial-gradient(circle at 80% 50%, rgba(168,90,72,0.08), transparent 60%); }
        .ier-hero > * { position: relative; z-index: 1; }
        .ier-mark { width: 64px; height: 64px; border-radius: 16px;
                    background: rgba(168,90,72,0.10); color: var(--rose-500);
                    display: flex; align-items: center; justify-content: center; }
        .ier-l { font-size: 11px; color: var(--rose-500);
                 letter-spacing: 0.1em; text-transform: uppercase;
                 display: flex; align-items: center; gap: 8px; }
        .ier-l .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--rose-500); }
        .ier-h { font-family: var(--font-display); font-size: 36px; line-height: 1.1;
                 color: var(--ink-900); letter-spacing: -0.02em;
                 margin: 8px 0 6px; font-weight: 400; }
        .ier-h em { font-style: italic; color: var(--rose-500); }
        .ier-s { font-size: 13.5px; color: var(--ink-600); line-height: 1.55; max-width: 600px; }
        .ier-meta { display: flex; gap: 14px; margin-top: 12px;
                    font-size: 11px; color: var(--ink-500); }
        .ier-meta strong { color: var(--ink-800); font-family: var(--font-mono); font-weight: 500; }
        .ier-actions { display: flex; flex-direction: column; gap: 8px; }
        .ier-btn { display: inline-flex; align-items: center; gap: 8px;
                   padding: 9px 14px; border: 1px solid var(--line);
                   border-radius: 9px; background: var(--cream-50);
                   color: var(--ink-700); font-size: 12.5px;
                   cursor: pointer; }
        .ier-btn.amber { background: var(--amber-500); color: var(--cream-50);
                         border-color: var(--amber-500); font-weight: 500; }
        .ier-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        .ier-detail { display: grid; grid-template-columns: 1fr 1.2fr; gap: 16px;
                      background: var(--cream-50); border: 1px solid var(--line);
                      border-radius: 14px; padding: 20px 24px; }
        .ier-detail-h { font-size: 12px; color: var(--ink-800); font-weight: 500;
                        letter-spacing: 0.02em; margin-bottom: 10px; }
        .ier-detail-s { font-size: 11.5px; color: var(--ink-600); line-height: 1.5; margin-bottom: 10px; }
        .ier-detail-list { display: flex; flex-direction: column; gap: 8px; }
        .ier-detail-item { display: flex; gap: 10px; align-items: flex-start;
                           font-size: 12.5px; color: var(--ink-700); }
        .ier-detail-item .num { width: 22px; height: 22px; border-radius: 6px;
                                background: var(--cream-200); color: var(--ink-700);
                                display: flex; align-items: center; justify-content: center;
                                font-family: var(--font-mono); font-size: 11px;
                                font-weight: 500; flex-shrink: 0; }
        .ier-code { font-family: var(--font-mono); font-size: 12px; color: var(--ink-700);
                    background: var(--cream-100); border-left: 3px solid var(--rose-500);
                    padding: 12px 16px; border-radius: 0 8px 8px 0; margin-top: 4px; }
        .ier-code .num { color: var(--ink-500); margin-right: 12px; }
        .ier-code .err { color: var(--rose-500); }

        .ier-others { background: var(--cream-50); border: 1px solid var(--line);
                      border-radius: 14px; padding: 0; flex: 1; min-height: 0;
                      overflow: hidden; display: flex; flex-direction: column; }
        .ier-others-h { padding: 16px 22px 12px; border-bottom: 1px solid var(--line);
                        display: flex; justify-content: space-between; align-items: flex-start; }
        .ier-other-row { display: grid; grid-template-columns: 44px 1fr 140px; gap: 16px;
                         align-items: center; padding: 14px 22px;
                         border-bottom: 1px dashed var(--line); }
        .ier-other-row:last-child { border-bottom: none; }
        .ier-other-ico { width: 44px; height: 44px; border-radius: 11px;
                         display: flex; align-items: center; justify-content: center; }
        .ier-other-ico.warn { background: var(--amber-100); color: var(--amber-500); }
        .ier-other-ico.danger { background: rgba(168,90,72,0.10); color: var(--rose-500); }
        .ier-other-t { font-size: 13.5px; color: var(--ink-900); font-weight: 500; }
        .ier-other-sub { font-size: 11px; color: var(--ink-500); margin-top: 2px;
                         font-family: var(--font-mono); }
        .ier-other-d { font-size: 12px; color: var(--ink-600); margin-top: 4px; line-height: 1.4; }
        .ier-other-cta { display: flex; flex-direction: column; gap: 6px; }
      `}</style>

      <div className="ier-bread">
        <span>Importer</span>
        <IcArrowR size={10}/>
        <span className="err">Erreur de lecture</span>
      </div>

      {/* HERO */}
      <div className="ier-hero">
        <div className="ier-mark">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4"/><path d="M12 17h.01"/>
            <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/>
          </svg>
        </div>
        <div>
          <div className="ier-l"><span className="dot"/>Format non reconnu</div>
          <h2 className="ier-h">Impossible de lire ce <em>relevé</em>.</h2>
          <p className="ier-s">
            Ambre n'a pas reconnu la structure du fichier — ni le format BNP, ni un CSV standard. Le PDF est
            peut-être un export filtré, scanné, ou suit un format propriétaire que nous n'avons pas encore couvert.
          </p>
          <div className="ier-meta">
            <span>Fichier · <strong>autre-export-2024-Q4.pdf</strong></span>
            <span>Taille · <strong>1,2 Mo · 6 pages</strong></span>
            <span>Type détecté · <strong>application/pdf</strong></span>
          </div>
        </div>
        <div className="ier-actions">
          <button className="ier-btn amber" onClick={onRetry}><IcImport size={14}/>Essayer un autre fichier</button>
          <button className="ier-btn"><IcTag size={14}/>Configurer un parseur custom</button>
          <button className="ier-btn ghost">↻ Réessayer la lecture</button>
          <button className="ier-btn ghost">🛟 Voir l'aide d'import</button>
        </div>
      </div>

      {/* Detail */}
      <div className="ier-detail">
        <div>
          <div className="ier-detail-h">Ce qu'a essayé Ambre</div>
          <div className="ier-detail-list">
            {[
              { n: "1", t: "Détection du format",            s: "PDF valide · 6 pages · non chiffré ✓" },
              { n: "2", t: "Recherche d'un parseur connu",    s: "Aucun parseur correspondant (BNP, LBP, CA, BoursoBank, Revolut)" },
              { n: "3", t: "Extraction tabulaire générique",  s: "Tableaux détectés mais colonnes ambiguës — pas de date claire" },
              { n: "4", t: "Fallback texte simple",            s: "Échoué · le contenu est mis en page sur 2 colonnes" },
            ].map(s => (
              <div key={s.n} className="ier-detail-item">
                <span className="num">{s.n}</span>
                <div>
                  <div style={{ color: "var(--ink-900)", fontWeight: 500 }}>{s.t}</div>
                  <div style={{ color: "var(--ink-500)", marginTop: 2 }}>{s.s}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="ier-detail-h">Journal technique</div>
          <div className="ier-detail-s">
            Si vous écrivez un parseur custom, voici les premières lignes interprétées du fichier.
            Vous pouvez consulter le log complet dans <strong>Paramètres → Sauvegarde</strong>.
          </div>
          <div className="ier-code">
            <div><span className="num">01</span>scanning PDF · 6 pages · 1.2MB</div>
            <div><span className="num">02</span>fonts: Helvetica, Helvetica-Bold</div>
            <div><span className="num">03</span>tables: 12 candidates, 2-column layout detected</div>
            <div><span className="num">04</span>match-bnp:  <span className="err">no match (logo missing)</span></div>
            <div><span className="num">05</span>match-csv:  <span className="err">not a csv</span></div>
            <div><span className="num">06</span>match-ofx:  <span className="err">no OFX header</span></div>
            <div><span className="num">07</span>generic-table: ambiguous column types</div>
            <div><span className="num">08</span><span className="err">→ ERR_FORMAT_UNKNOWN</span>  abandoning</div>
          </div>
        </div>
      </div>

      {/* Other error cases */}
      <div className="ier-others">
        <div className="ier-others-h">
          <div>
            <div style={{ fontSize: 13, color: "var(--ink-800)", fontWeight: 500 }}>Autres erreurs récentes</div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>2 fichiers · cliquer pour voir le détail</div>
          </div>
          <button className="ier-btn ghost" style={{ padding: "4px 10px" }}>Effacer le journal</button>
        </div>
        {otherCases.map(c => (
          <div key={c.kind} className="ier-other-row">
            <div className={"ier-other-ico " + c.tone}>
              {c.kind === "duplicate"
                ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="14" height="14" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2"/></svg>
                : <IcLock size={20}/>}
            </div>
            <div>
              <div className="ier-other-t">{c.title}</div>
              <div className="ier-other-sub">{c.sub}</div>
              <div className="ier-other-d">{c.desc}</div>
            </div>
            <div className="ier-other-cta">
              <button className="ier-btn" style={{ padding: "6px 10px", fontSize: 11.5 }}>
                {c.kind === "duplicate" ? "Importer uniquement les nouvelles" : "Ouvrir le fichier"}
              </button>
              <button className="ier-btn ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
                Tout annuler
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
