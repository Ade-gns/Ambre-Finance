/* Écran Historique des alertes — Journal interactif des alertes déclenchées.
   - Marquage lu/non lu
   - Archivage
   - Filtres : Toutes / Non lues / Cette semaine / Archivées
   - "Tout marquer comme lu" — vide les non-lues d'un coup
   - Compteurs KPI mis à jour en live */

import { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocalStorage } from "../lib/storage";
import {
  IcBell, IcSettings, IcFilter, IcCalendar, IcChevDn
} from "../lib/icons";

const KIND_STYLES = {
  threshold: { bg: "rgba(184,105,61,0.10)",  fg: "#b8693d" },
  anomaly:   { bg: "rgba(214,138,118,0.12)", fg: "#a85a48" },
  event:     { bg: "rgba(107,122,79,0.10)",  fg: "#6b7a4f" },
  duplicate: { bg: "rgba(122,92,58,0.10)",   fg: "#7a5c3a" },
};

const INITIAL_ALERTS = [
  { id: 1, day: "Aujourd'hui · 14 mai", thisWeek: true, month: "Mai 2026",
    time: "14:32", kind: "threshold", name: "Loisirs · seuil 85 %",
    cat: { label: "Loisirs", color: "#a85a48" },
    msg: "97 % du budget mensuel atteint (96,80 € / 100 €). Il reste 17 jours.",
    source: "Le Petit Café · −14,20 €",
    state: "unread", cta: "Ajuster le budget" },
  { id: 2, day: "Aujourd'hui · 14 mai", thisWeek: true, month: "Mai 2026",
    time: "10:11", kind: "anomaly", name: "Transaction inhabituelle détectée",
    cat: { label: "Loisirs", color: "#a85a48" },
    msg: "FNAC.COM · 229,90 € — montant supérieur à votre moyenne pour cette catégorie.",
    source: "11 mai · Carte BNP",
    state: "unread", cta: "Voir la transaction" },
  { id: 3, day: "Hier · 13 mai", thisWeek: true, month: "Mai 2026",
    time: "18:04", kind: "event", name: "Salaire reçu",
    cat: { label: "Revenus", color: "#6b7a4f" },
    msg: "Virement Dupont SAS · +2 560,00 €. Détecté automatiquement comme récurrent.",
    source: "Compte courant BNP",
    state: "read", cta: "Voir le détail" },
  { id: 4, day: "Hier · 13 mai", thisWeek: true, month: "Mai 2026",
    time: "09:47", kind: "threshold", name: "Alimentation · seuil 90 %",
    cat: { label: "Alimentation", color: "#b8693d" },
    msg: "450 € dépensés sur 500 € de budget. Vous êtes dans la trajectoire moyenne.",
    source: "Carrefour Market · −52,34 €",
    state: "read", cta: "Ajuster le budget" },
  { id: 5, day: "Cette semaine · 11 mai", thisWeek: true, month: "Mai 2026",
    time: "Dim. 22h", kind: "event", name: "Nouvel abonnement détecté",
    cat: { label: "Abonnements", color: "#cd8459" },
    msg: "« SPOTIFY » apparaît pour la 3e fois consécutive — créer une règle Abonnements ?",
    source: "Spotify Premium · 10,99 €/mois",
    state: "read", cta: "Créer la règle" },
  { id: 6, day: "Cette semaine · 11 mai", thisWeek: true, month: "Mai 2026",
    time: "Sam. 19h", kind: "duplicate", name: "Doublon potentiel",
    cat: { label: "Loisirs", color: "#a85a48" },
    msg: "Deux transactions Cinéma MK2 identiques en 48h. Vérifier s'il s'agit d'un doublon.",
    source: "10 mai · 22,00 € · 22,00 €",
    state: "read", cta: "Comparer" },
  { id: 7, day: "07 – 09 mai", thisWeek: false, month: "Mai 2026",
    time: "09/05 · 11:20", kind: "anomaly", name: "Catégorie inhabituelle",
    cat: { label: "Santé", color: "#9d8b73" },
    msg: "Premier mouvement dans la catégorie Santé ce mois — créer un budget ?",
    source: "Pharmacie de l'Hôtel · −22,50 €",
    state: "archived", cta: "Définir un budget" },
];

const FILTERS = [
  { key: "all",      label: "Toutes" },
  { key: "unread",   label: "Non lues" },
  { key: "thisweek", label: "Cette semaine" },
  { key: "archived", label: "Archivées" },
];

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
  const [alerts, setAlerts] = useLocalStorage("alerts", INITIAL_ALERTS);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const [catOpen, setCatOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [selCat, setSelCat] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const catRef   = useRef(null);
  const monthRef = useRef(null);
  useEffect(() => {
    if (!catOpen) return;
    const fn = e => { if (!catRef.current?.contains(e.target)) setCatOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [catOpen]);
  useEffect(() => {
    if (!monthOpen) return;
    const fn = e => { if (!monthRef.current?.contains(e.target)) setMonthOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [monthOpen]);
  const CAT_LIST = [
    { label: "Toutes",       color: null },
    { label: "Alimentation", color: "#b8693d" },
    { label: "Loisirs",      color: "#a85a48" },
    { label: "Abonnements",  color: "#cd8459" },
    { label: "Revenus",      color: "#6b7a4f" },
    { label: "Santé",        color: "#9d8b73" },
    { label: "Logement",     color: "#3d2817" },
    { label: "Transports",   color: "#7a8c5c" },
  ];
  const MONTH_LIST = [null, "Mai 2026","Avril 2026","Mars 2026","Février 2026","Janvier 2026","Décembre 2025"];

  const markAsRead = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, state: "read" } : a));
  };
  const archive = (id) => {
    setAlerts(alerts.map(a => a.id === id ? { ...a, state: "archived" } : a));
  };
  const markAllRead = () => {
    setAlerts(alerts.map(a => a.state === "unread" ? { ...a, state: "read" } : a));
  };

  const visible = useMemo(() => {
    let result;
    if (filter === "all")           result = alerts.filter(a => a.state !== "archived");
    else if (filter === "unread")   result = alerts.filter(a => a.state === "unread");
    else if (filter === "thisweek") result = alerts.filter(a => a.thisWeek && a.state !== "archived");
    else if (filter === "archived") result = alerts.filter(a => a.state === "archived");
    else result = [...alerts];
    if (selCat)   result = result.filter(a => a.cat.label === selCat);
    if (selMonth) result = result.filter(a => a.month === selMonth);
    return result;
  }, [alerts, filter, selCat, selMonth]);

  const counts = useMemo(() => ({
    all:      alerts.filter(a => a.state !== "archived").length,
    unread:   alerts.filter(a => a.state === "unread").length,
    thisweek: alerts.filter(a => a.thisWeek && a.state !== "archived").length,
    archived: alerts.filter(a => a.state === "archived").length,
  }), [alerts]);

  const mostAlerted = useMemo(() => {
    const c = {};
    alerts.forEach(a => { c[a.cat.label] = (c[a.cat.label] || 0) + 1; });
    const top = Object.entries(c).sort((a, b) => b[1] - a[1])[0];
    return top ? {
      label: top[0], count: top[1],
      color: alerts.find(a => a.cat.label === top[0]).cat.color
    } : null;
  }, [alerts]);

  const grouped = useMemo(() => {
    const map = new Map();
    visible.forEach(a => {
      if (!map.has(a.day)) map.set(a.day, []);
      map.get(a.day).push(a);
    });
    return Array.from(map.entries()).map(([day, items]) => ({ day, items }));
  }, [visible]);

  return (
    <main className="ah-main">
      <style>{AH_STYLES}</style>

      <div className="ah-top">
        <div>
          <div className="ah-bread">Ambre · <strong>Alertes</strong></div>
          <h1 className="ah-h1">Mes <em>alertes</em>.</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="ah-btn"
                  onClick={markAllRead}
                  disabled={counts.unread === 0}
                  style={counts.unread === 0 ? { opacity: 0.5, cursor: "not-allowed" } : {}}>
            Tout marquer comme lu
          </button>
          <button className="ah-btn" onClick={() => navigate("/settings")}>
            <IcSettings size={13}/>Configurer les alertes
          </button>
        </div>
      </div>

      <div className="ah-stats">
        <div className="ah-stat">
          <div className="ah-stat-l">Non lues</div>
          <div className="ah-stat-v"
               style={{ color: counts.unread > 0 ? "var(--amber-500)" : "var(--ink-400)" }}>
            {counts.unread}
          </div>
          <div className="ah-stat-s">
            {counts.unread > 0 ? "depuis aujourd'hui" : "tout est lu ✓"}
          </div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-l">Déclenchées ce mois</div>
          <div className="ah-stat-v">{alerts.length}</div>
          <div className="ah-stat-s">↑ 4 vs avril</div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-l">Catégorie la + alertée</div>
          <div className="ah-stat-v" style={{ color: mostAlerted?.color, fontSize: 22 }}>
            {mostAlerted?.label || "—"}
          </div>
          <div className="ah-stat-s">{mostAlerted?.count || 0} déclenchements</div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-l">Alertes actives</div>
          <div className="ah-stat-v">5</div>
          <div className="ah-stat-s">+ 4 modèles disponibles</div>
        </div>
      </div>

      <div className="ah-toolbar">
        <div className="ah-seg">
          {FILTERS.map(f => (
            <button key={f.key}
                    className={filter === f.key ? "active" : ""}
                    onClick={() => setFilter(f.key)}>
              {f.label}
              <span className="num"
                    style={f.key === "unread" && counts.unread > 0
                          ? { color: "var(--amber-500)" } : {}}>
                {counts[f.key]}
              </span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1 }}/>
        <div ref={catRef} style={{ position: "relative" }}>
          <button className="ah-btn" onClick={() => setCatOpen(o => !o)}>
            <IcFilter size={13}/>
            {selCat || "Par catégorie"}
          </button>
          {catOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
              background: "var(--cream-50)", border: "1px solid var(--line)",
              borderRadius: 10, boxShadow: "0 8px 24px rgba(61,40,23,0.12)",
              minWidth: 190, overflow: "hidden",
            }}>
              {CAT_LIST.map(c => (
                <button key={c.label} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%",
                  padding: "9px 14px", background: selCat === c.label || (!selCat && !c.color) ? "var(--amber-100)" : "none",
                  color: selCat === c.label || (!selCat && !c.color) ? "var(--amber-500)" : "var(--ink-800)",
                  border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: 13,
                }} onClick={() => { setSelCat(c.color ? c.label : null); setCatOpen(false); }}>
                  {c.color && <span className="amb-dot" style={{ background: c.color }}/>}
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div ref={monthRef} style={{ position: "relative" }}>
          <button className="ah-btn" onClick={() => setMonthOpen(o => !o)}>
            <IcCalendar size={13}/>{selMonth || "Mois"} <IcChevDn size={12}/>
          </button>
          {monthOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", right: 0, zIndex: 50,
              background: "var(--cream-50)", border: "1px solid var(--line)",
              borderRadius: 10, boxShadow: "0 8px 24px rgba(61,40,23,0.12)",
              minWidth: 180, overflow: "hidden",
            }}>
              {MONTH_LIST.map(m => (
                <button key={m ?? "all"} style={{
                  display: "block", width: "100%", padding: "9px 16px",
                  background: m === selMonth ? "var(--amber-100)" : "none",
                  color: m === selMonth ? "var(--amber-500)" : "var(--ink-800)",
                  border: "none", borderBottom: "1px solid var(--line)", cursor: "pointer", fontSize: 13, textAlign: "left",
                }} onClick={() => { setSelMonth(m); setMonthOpen(false); }}>
                  {m ?? "Tous les mois"}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="ah-timeline">
        {grouped.length === 0 ? (
          <EmptyAlerts filter={filter} selCat={selCat} selMonth={selMonth}/>
        ) : (
          grouped.map(d => (
            <div key={d.day}>
              <div className="ah-day">
                <strong>{d.day}</strong>
                <span className="line"/>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--ink-500)" }}>
                  {d.items.length} alerte{d.items.length > 1 ? "s" : ""}
                </span>
              </div>
              {d.items.map(a => {
                const style = KIND_STYLES[a.kind];
                return (
                  <div key={a.id} className={"ah-row " + a.state}>
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
                    {a.state !== "archived" ? (
                      <>
                        <button className="ah-iconbtn"
                                title={a.state === "unread" ? "Marquer comme lu" : "Déjà lu"}
                                onClick={() => markAsRead(a.id)}
                                disabled={a.state === "read"}
                                style={a.state === "read" ? { opacity: 0.4 } : {}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12l6 6 10-12"/>
                          </svg>
                        </button>
                        <button className="ah-iconbtn"
                                title="Archiver"
                                onClick={() => archive(a.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 5h18v4H3zM5 9v11a1 1 0 0 1-1 1h12a1 1 0 0 0 1-1V9M9 13h6"/>
                          </svg>
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="ah-iconbtn"
                                title="Désarchiver"
                                onClick={() => markAsRead(a.id)}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                               strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7l9-4 9 4"/><path d="M3 12l9 4 9-4"/><path d="M3 17l9 4 9-4"/>
                          </svg>
                        </button>
                        <span style={{ width: 30, height: 30 }}/>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function EmptyAlerts({ filter, selCat, selMonth }) {
  const msgs = {
    all:      { t: "Aucune alerte active",        s: "Vos finances sont sereines pour le moment." },
    unread:   { t: "Tout est lu ✓",               s: "Plus aucune alerte non lue. Bon travail !" },
    thisweek: { t: "Aucune alerte cette semaine", s: "La semaine s'annonce calme côté finances." },
    archived: { t: "Rien dans les archives",      s: "Les alertes archivées apparaîtront ici." },
  };
  const hasCombinedFilter = selCat || selMonth;
  const m = hasCombinedFilter
    ? { t: "Aucun résultat",
        s: `Aucune alerte${selCat ? ` pour « ${selCat} »` : ""}${selMonth ? ` en ${selMonth}` : ""}.` }
    : msgs[filter];
  return (
    <div style={{
      padding: "60px 24px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
      textAlign: "center"
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: "var(--cream-100)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "var(--sage-500)"
      }}>
        <IcBell size={26}/>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-900)" }}>
        {m.t}
      </div>
      <div style={{ fontSize: 13, color: "var(--ink-500)", maxWidth: 320 }}>
        {m.s}
      </div>
    </div>
  );
}

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

  .ah-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
  .ah-stat { background: var(--cream-50); border: 1px solid var(--line);
             border-radius: 12px; padding: 14px 18px; }
  .ah-stat-l { font-size: 10px; color: var(--ink-500);
               letter-spacing: 0.08em; text-transform: uppercase; }
  .ah-stat-v { font-family: var(--font-display); font-size: 26px;
               color: var(--ink-900); line-height: 1.1; margin-top: 4px;
               transition: color 0.2s; }
  .ah-stat-s { font-size: 11px; color: var(--ink-500); margin-top: 4px;
               font-family: var(--font-mono); }

  .ah-toolbar { display: flex; align-items: center; gap: 8px; }
  .ah-seg { display: flex; padding: 3px; background: var(--cream-50);
            border: 1px solid var(--line); border-radius: 9px; gap: 2px; }
  .ah-seg button { padding: 5px 11px; border-radius: 6px; font-size: 12px;
                   color: var(--ink-600); background: transparent; border: none;
                   cursor: pointer;
                   display: inline-flex; align-items: center; gap: 6px;
                   transition: background 0.15s, color 0.15s; }
  .ah-seg button:hover { color: var(--ink-800); }
  .ah-seg button.active { background: var(--cream-200); color: var(--ink-800); font-weight: 500; }
  .ah-seg .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }

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
            position: relative;
            transition: background 0.2s, opacity 0.2s; }
  .ah-row:last-child { border-bottom: none; }
  .ah-row.unread { background: var(--amber-100); }
  .ah-row.unread::before { content: ""; position: absolute; left: 0; width: 2px;
                            top: 0; bottom: 0; background: var(--amber-500); }
  .ah-row.archived { opacity: 0.6; background: var(--cream-100); }

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
                padding: 0; cursor: pointer;
                transition: background 0.15s, color 0.15s; }
  .ah-iconbtn:hover:not(:disabled) { background: var(--cream-200); color: var(--ink-800); }
  .ah-iconbtn:disabled { cursor: not-allowed; }
`;
