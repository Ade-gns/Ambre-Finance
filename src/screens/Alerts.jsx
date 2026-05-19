/* Écran Historique des alertes — Journal des alertes déclenchées, groupé par jour.
   - 4 KPIs : Non lues, Déclenchées ce mois, Catégorie la + alertée, Alertes actives
   - Toolbar avec segmented filter (Toutes / Non lues / Cette semaine / Archivées)
   - Timeline groupée par jour avec 4 types d'alertes (threshold / anomaly / event / duplicate) */

import {
  IcBell, IcSettings, IcFilter, IcCalendar, IcChevDn
} from "../lib/icons";

const KIND_STYLES = {
  threshold: { bg: "rgba(184,105,61,0.10)",  fg: "#b8693d" },  // seuil dépassé
  anomaly:   { bg: "rgba(214,138,118,0.12)", fg: "#a85a48" },  // anomalie
  event:     { bg: "rgba(107,122,79,0.10)",  fg: "#6b7a4f" },  // événement (salaire, etc.)
  duplicate: { bg: "rgba(122,92,58,0.10)",   fg: "#7a5c3a" },  // doublon
};

const DAYS = [
  {
    label: "Aujourd'hui · 14 mai",
    items: [
      {
        time: "14:32", kind: "threshold",
        name: "Loisirs · seuil 85 %",
        cat: { label: "Loisirs", color: "#a85a48" },
        msg: "97 % du budget mensuel atteint (96,80 € / 100 €). Il reste 17 jours.",
        source: "Le Petit Café · −14,20 €",
        state: "unread", cta: "Ajuster le budget",
      },
      {
        time: "10:11", kind: "anomaly",
        name: "Transaction inhabituelle détectée",
        cat: { label: "Loisirs", color: "#a85a48" },
        msg: "FNAC.COM · 229,90 € — montant supérieur à votre moyenne pour cette catégorie.",
        source: "11 mai · Carte BNP",
        state: "unread", cta: "Voir la transaction",
      },
    ]
  },
  {
    label: "Hier · 13 mai",
    items: [
      {
        time: "18:04", kind: "event",
        name: "Salaire reçu",
        cat: { label: "Revenus", color: "#6b7a4f" },
        msg: "Virement Dupont SAS · +2 560,00 €. Détecté automatiquement comme récurrent.",
        source: "Compte courant BNP",
        state: "read", cta: "Voir le détail",
      },
      {
        time: "09:47", kind: "threshold",
        name: "Alimentation · seuil 90 %",
        cat: { label: "Alimentation", color: "#b8693d" },
        msg: "450 € dépensés sur 500 € de budget. Vous êtes dans la trajectoire moyenne.",
        source: "Carrefour Market · −52,34 €",
        state: "read", cta: "Ajuster le budget",
      },
    ]
  },
  {
    label: "Cette semaine · 11 mai",
    items: [
      {
        time: "Dim. 22h", kind: "event",
        name: "Nouvel abonnement détecté",
        cat: { label: "Abonnements", color: "#cd8459" },
        msg: "« SPOTIFY » apparaît pour la 3e fois consécutive — créer une règle Abonnements ?",
        source: "Spotify Premium · 10,99 €/mois",
        state: "read", cta: "Créer la règle",
      },
      {
        time: "Sam. 19h", kind: "duplicate",
        name: "Doublon potentiel",
        cat: { label: "Loisirs", color: "#a85a48" },
        msg: "Deux transactions Cinéma MK2 identiques en 48h. Vérifier s'il s'agit d'un doublon.",
        source: "10 mai · 22,00 € · 22,00 €",
        state: "read", cta: "Comparer",
      },
    ]
  },
  {
    label: "07 – 09 mai",
    items: [
      {
        time: "09/05 · 11:20", kind: "anomaly",
        name: "Catégorie inhabituelle",
        cat: { label: "Santé", color: "#9d8b73" },
        msg: "Premier mouvement dans la catégorie Santé ce mois — créer un budget ?",
        source: "Pharmacie de l'Hôtel · −22,50 €",
        state: "archived", cta: "Définir un budget",
      },
    ]
  },
];

/* Icône SVG par type d'alerte */
function AlertKindIcon({ kind }) {
  if (kind === "threshold") return <IcBell size={18}/>;
  if (kind === "anomaly") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 9v4"/><circle cx="12" cy="17" r="1" fill="currentColor"/>
        <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/>
      </svg>
    );
  }
  if (kind === "event") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 12.5l5.5 5.5L20 7"/>
      </svg>
    );
  }
  if (kind === "duplicate") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
           strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="4" width="14" height="14" rx="2"/>
        <rect x="9" y="9" width="11" height="11" rx="2"/>
      </svg>
    );
  }
  return null;
}

export default function Alerts() {
  return (
    <main className="ah-main">
      <style>{AH_STYLES}</style>

      <div className="ah-top">
        <div>
          <div className="ah-bread">Ambre · <strong>Alertes</strong></div>
          <h1 className="ah-h1">Mes <em>alertes</em>.</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ah-btn">Tout marquer comme lu</button>
          <button className="ah-btn"><IcSettings size={13}/>Configurer les alertes</button>
        </div>
      </div>

      {/* Stats */}
      <div className="ah-stats">
        <div className="ah-stat">
          <div className="ah-stat-l">Non lues</div>
          <div className="ah-stat-v" style={{ color: "var(--amber-500)" }}>2</div>
          <div className="ah-stat-s">depuis aujourd'hui</div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-l">Déclenchées ce mois</div>
          <div className="ah-stat-v">14</div>
          <div className="ah-stat-s">↑ 4 vs avril</div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-l">Catégorie la + alertée</div>
          <div className="ah-stat-v" style={{ color: "#a85a48", fontSize: 22 }}>Loisirs</div>
          <div className="ah-stat-s">5 déclenchements</div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-l">Alertes actives</div>
          <div className="ah-stat-v">5</div>
          <div className="ah-stat-s">+ 4 modèles disponibles</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="ah-toolbar">
        <div className="ah-seg">
          <button className="active">Toutes <span className="num">14</span></button>
          <button>Non lues <span className="num" style={{ color: "var(--amber-500)" }}>2</span></button>
          <button>Cette semaine <span className="num">7</span></button>
          <button>Archivées <span className="num">8</span></button>
        </div>
        <div style={{ flex: 1 }}/>
        <button className="ah-btn"><IcFilter size={13}/>Par catégorie</button>
        <button className="ah-btn"><IcCalendar size={13}/>Mai 2026 <IcChevDn size={12}/></button>
      </div>

      {/* Timeline */}
      <div className="ah-timeline">
        {DAYS.map(d => (
          <div key={d.label}>
            <div className="ah-day">
              <strong>{d.label}</strong>
              <span className="line"/>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-500)" }}>
                {d.items.length} alerte{d.items.length > 1 ? "s" : ""}
              </span>
            </div>
            {d.items.map((a, i) => {
              const style = KIND_STYLES[a.kind];
              return (
                <div key={i} className={"ah-row " + a.state}>
                  <span className="ah-time">{a.time}</span>
                  <div className="ah-ico" style={{ background: style.bg, color: style.fg }}>
                    <AlertKindIcon kind={a.kind}/>
                  </div>
                  <div>
                    <div className="ah-name">
                      {a.state === "unread" && <span className="unread-dot"/>}
                      {a.name}
                    </div>
                    <div className="ah-msg">{a.msg}</div>
                    <div className="ah-src">
                      <span className="amb-dot" style={{ background: a.cat.color }}/>
                      {a.cat.label} · {a.source}
                    </div>
                  </div>
                  <button className="ah-cta">{a.cta} →</button>
                  <button className="ah-iconbtn" title="Marquer comme lu">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 12l6 6 10-12"/>
                    </svg>
                  </button>
                  <button className="ah-iconbtn" title="Archiver">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 5h18v4H3zM5 9v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M9 13h6"/>
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────────────────────────── */
const AH_STYLES = `
  .ah-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px;
             height: 100%; overflow: hidden;
             background: #efe7d6; color: var(--ink-800); font-size: 13px; }
  .ah-top { display: flex; align-items: flex-end; justify-content: space-between; }
  .ah-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .ah-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .ah-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
           color: var(--ink-900); letter-spacing: -0.01em; }
  .ah-h1 em { font-style: italic; color: var(--amber-500); }
  .ah-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px;
            background: var(--cream-50); color: var(--ink-700);
            font-size: 12px; cursor: pointer; }

  /* KPI stats */
  .ah-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .ah-stat { background: var(--cream-50); border: 1px solid var(--line);
             border-radius: 12px; padding: 14px 18px; }
  .ah-stat-l { font-size: 10px; color: var(--ink-500);
               letter-spacing: 0.08em; text-transform: uppercase; }
  .ah-stat-v { font-family: var(--font-display); font-size: 26px;
               color: var(--ink-900); line-height: 1.1; margin-top: 4px; }
  .ah-stat-s { font-size: 11px; color: var(--ink-500); margin-top: 4px;
               font-family: var(--font-mono); }

  /* Toolbar */
  .ah-toolbar { display: flex; align-items: center; gap: 8px; }
  .ah-seg { display: flex; padding: 3px; background: var(--cream-50);
            border: 1px solid var(--line); border-radius: 9px; gap: 2px; }
  .ah-seg button { padding: 5px 11px; border-radius: 6px; font-size: 12px;
                   color: var(--ink-600); background: transparent; border: none;
                   cursor: pointer;
                   display: inline-flex; align-items: center; gap: 6px; }
  .ah-seg button.active { background: var(--cream-200); color: var(--ink-800); font-weight: 500; }
  .ah-seg .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }

  /* Timeline */
  .ah-timeline { background: var(--cream-50); border: 1px solid var(--line);
                 border-radius: 14px;
                 flex: 1; min-height: 0; overflow: auto; padding: 4px 0; }
  .ah-day { padding: 14px 24px 4px; font-size: 10px; color: var(--ink-500);
            letter-spacing: 0.1em; text-transform: uppercase;
            position: sticky; top: 0;
            background: linear-gradient(var(--cream-50) 80%, transparent);
            z-index: 1; display: flex; align-items: center; gap: 10px; }
  .ah-day strong { color: var(--ink-800); font-weight: 500;
                   letter-spacing: 0; text-transform: none; font-size: 12px; }
  .ah-day .line { flex: 1; height: 1px; background: var(--line); }

  .ah-row { display: grid;
            grid-template-columns: 60px 44px 1fr 130px 32px 32px;
            align-items: center; gap: 14px;
            padding: 14px 24px; border-bottom: 1px dashed var(--line);
            position: relative; }
  .ah-row:last-child { border-bottom: none; }
  .ah-row.unread { background: var(--amber-100); }
  .ah-row.unread::before { content: ""; position: absolute; left: 0; width: 2px;
                            top: 0; bottom: 0; background: var(--amber-500); }

  .ah-time { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
  .ah-ico { width: 44px; height: 44px; border-radius: 11px;
            display: flex; align-items: center; justify-content: center; }
  .ah-name { font-size: 13.5px; color: var(--ink-900); font-weight: 500;
             display: flex; align-items: center; gap: 10px; }
  .ah-name .unread-dot { width: 6px; height: 6px; border-radius: 999px;
                         background: var(--amber-500); }
  .ah-msg { font-size: 12px; color: var(--ink-600); margin-top: 3px; line-height: 1.45; }
  .ah-src { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono);
            margin-top: 4px; display: flex; align-items: center; gap: 6px; }
  .ah-src .amb-dot { width: 7px; height: 7px; }

  .ah-cta { font-size: 11px; color: var(--amber-500);
            background: transparent; border: 1px solid rgba(184,105,61,0.3);
            padding: 5px 10px; border-radius: 7px; cursor: pointer; }
  .ah-iconbtn { width: 30px; height: 30px;
                border: 1px solid var(--line); background: var(--cream-50);
                color: var(--ink-500); border-radius: 7px;
                display: flex; align-items: center; justify-content: center;
                padding: 0; cursor: pointer; }
`;
