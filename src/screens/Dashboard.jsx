/* Dashboard — "Atelier · Clair"
   Vue d'ensemble du mois. Converti du fichier d'origine en composant React modulaire.
   Layout : sidebar (gérée par App) + main (ce composant). */

import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "../lib/storage";
import { useNavigate } from "react-router-dom";
import {
  useTransactions, useCategories,
  computeMonthly, computeCatTotals,
  txMonthKey, monthKeyLabel, parseTxDate, MONTHS_FR
} from "../lib/store";
import {
  Sparkline, RingGauge
} from "../lib/chartPrimitives";
import { fmtEUR, pathSmooth } from "../lib/chartUtils";
import {
  IcCalendar, IcSearch, IcUpload, IcChevDn, IcArrowUp, IcArrowDn, IcDot
} from "../lib/icons";

export default function Dashboard() {
  const navigate    = useNavigate();
  const [transactions] = useTransactions();
  const [categories]   = useCategories();
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [chartPeriod, setChartPeriod] = useLocalStorage("dash.chartPeriod", "12 m");
  const [firstName] = useLocalStorage("stg.firstName", "Camille");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  // Derive monthly data
  const monthly = computeMonthly(transactions);       // [{key, m, exp, inc}, ...] oldest→newest
  const monthKeys = monthly.map(m => m.key);           // ["01/2026", "05/2026", ...]
  const [selectedMonthKey, setSelectedMonthKey] = useState(null);

  // Auto-select the latest month when data loads
  const latestKey = monthly.length > 0 ? monthly[monthly.length - 1].key : null;
  const activeKey = selectedMonthKey && monthKeys.includes(selectedMonthKey) ? selectedMonthKey : latestKey;

  const current = monthly.find(m => m.key === activeKey) || { exp: 0, inc: 0 };
  const prevIdx = monthly.findIndex(m => m.key === activeKey) - 1;
  const prev    = prevIdx >= 0 ? monthly[prevIdx] : null;

  const totalExp = current.exp;
  const totalInc = current.inc;
  const net      = totalInc - totalExp;

  // Budget = sum of category budgets (excluding inc)
  const budget = categories.filter(c => c.id !== "inc").reduce((s, c) => s + (c.budget || 0), 0) || 2000;
  const pct    = budget > 0 ? totalExp / budget : 0;
  const expDelta = prev ? (totalExp - prev.exp) / (prev.exp || 1) : 0;

  // Monthly transactions for selected period
  const monthTxs = transactions.filter(t => txMonthKey(t.d) === activeKey);

  // Daily expense array for heatmap
  const [monthNum, yearNum] = activeKey ? activeKey.split("/").map(Number) : [new Date().getMonth() + 1, new Date().getFullYear()];
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getMonth() + 1 === monthNum && today.getFullYear() === yearNum;
  const todayDay = isCurrentMonth ? today.getDate() : daysInMonth;

  const dailyExp = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    if (day > todayDay) return null;
    const total = monthTxs
      .filter(t => { const p = t.d.split("/"); return parseInt(p[0], 10) === day; })
      .filter(t => t.amt < 0)
      .reduce((s, t) => s + Math.abs(t.amt), 0);
    return total;
  });

  // Category totals for selected month
  const catTotals = computeCatTotals(transactions, categories, activeKey);

  // Recent transactions (last 10 of selected month, sorted newest first)
  const recentTxs = [...monthTxs]
    .sort((a, b) => {
      const da = parseTxDate(a.d), db = parseTxDate(b.d);
      return (db?.getTime() || 0) - (da?.getTime() || 0);
    })
    .slice(0, 10);

  // Group recentTxs by date for display
  const recentGrouped = {};
  recentTxs.forEach(t => {
    const key = t.d;
    if (!recentGrouped[key]) recentGrouped[key] = [];
    recentGrouped[key].push(t);
  });

  const activeLabel = monthKeyLabel(activeKey);
  const prevLabel = prev ? monthKeyLabel(prev.key) : null;

  return (
    <main className="atc-main">
      <style>{`
        .atc-main {
          padding: 22px 28px;
          display: flex; flex-direction: column;
          gap: 14px;
          overflow: auto;
          background: var(--page-bg);
          color: var(--ink-800);
          font-size: 13px;
          height: 100%;
        }
        .atc-top {
          display: flex; align-items: center; justify-content: space-between;
        }
        .atc-bread {
          display: flex; align-items: center; gap: 8px;
          font-size: 11px; color: var(--ink-500);
          letter-spacing: 0.06em; text-transform: uppercase;
        }
        .atc-bread strong {
          color: var(--ink-800); font-weight: 500;
          letter-spacing: 0; text-transform: none;
        }
        .atc-tool {
          display: flex; gap: 8px; align-items: center;
        }
        .atc-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 7px 12px;
          border: 1px solid var(--line); border-radius: 8px;
          background: var(--cream-50); color: var(--ink-700);
          font-size: 12px; cursor: pointer;
        }
        .atc-btn.amber {
          background: var(--amber-500);
          color: var(--cream-50);
          border-color: var(--amber-500);
          font-weight: 500;
        }
        /* Hero */
        .atc-hero {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr 0.9fr 0.9fr;
          gap: 12px;
        }
        .atc-card {
          background: var(--cream-50);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 18px 20px;
        }
        .atc-hero-big {
          display: flex; flex-direction: column; gap: 8px;
          justify-content: space-between;
          min-height: 168px;
        }
        .atc-hero-l {
          font-size: 11px; color: var(--ink-500);
          letter-spacing: 0.1em; text-transform: uppercase;
        }
        .atc-hero-v {
          font-family: var(--font-display);
          font-size: 52px; line-height: 1;
          color: var(--ink-900);
          letter-spacing: -0.02em;
        }
        .atc-hero-v .cur  { font-size: 28px; color: var(--ink-500); vertical-align: top; margin-right: 4px; }
        .atc-hero-v .cents{ font-size: 24px; color: var(--ink-500); }
        .atc-hero-meta { display: flex; gap: 10px; flex-wrap: wrap; }
        .atc-pill {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px;
          background: var(--cream-200);
          font-size: 11px; color: var(--ink-700);
        }
        .atc-pill.warn { background: rgba(168,90,72,0.10); color: var(--rose-500); }
        .atc-pill.good { background: rgba(107,122,79,0.10); color: var(--sage-500); }

        .atc-mini-l { font-size: 11px; color: var(--ink-500); letter-spacing: 0.08em; text-transform: uppercase; }
        .atc-mini-v { font-family: var(--font-display); font-size: 32px; color: var(--ink-900); margin-top: 4px; }
        .atc-mini-d { display: flex; align-items: center; gap: 6px; font-size: 11px; margin-top: 6px; }
        .atc-delta-up   { color: var(--rose-500); }
        .atc-delta-down { color: var(--sage-500); }

        /* Body grid */
        .atc-body {
          display: grid; grid-template-columns: 1fr 1.3fr;
          gap: 12px; flex: 1; min-height: 0;
        }
        .atc-left, .atc-right {
          display: flex; flex-direction: column;
          gap: 12px; min-height: 0;
        }
        .atc-card-h {
          display: flex; align-items: flex-start; justify-content: space-between;
          margin-bottom: 12px;
        }
        .atc-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .atc-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        /* Categories grid */
        .atc-cats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .atc-cat-card {
          padding: 12px; border-radius: 10px;
          background: var(--cream-100);
          border: 1px solid var(--line);
          display: flex; flex-direction: column; gap: 8px;
        }
        .atc-cat-h { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ink-500); }
        .atc-cat-v { font-family: var(--font-display); font-size: 20px; color: var(--ink-900); }
        .atc-cat-foot {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 10px; color: var(--ink-500);
        }

        /* Heatmap */
        .atc-heat {
          display: grid; grid-template-columns: repeat(7, 1fr);
          gap: 4px;
        }
        .atc-heat-cell {
          aspect-ratio: 1.4 / 1;
          border-radius: 5px;
          display: flex; align-items: flex-end; justify-content: flex-start;
          padding: 4px 5px;
          font-size: 9px; font-family: var(--font-mono);
          color: var(--ink-700);
        }
        .atc-heat-cell.future { background: var(--grid-line); color: var(--ink-400); }
        .atc-heat-cell.today  { outline: 1.5px solid var(--amber-500); outline-offset: -1px; }

        /* Timeline transactions */
        .atc-tl { display: flex; flex-direction: column; gap: 8px; flex: 1; overflow: hidden; }
        .atc-tl-day {
          display: grid; grid-template-columns: 70px 1fr;
          gap: 12px; padding: 8px 0;
          border-bottom: 1px solid var(--line);
        }
        .atc-tl-day:last-child { border-bottom: none; }
        .atc-tl-date {
          font-family: var(--font-mono); font-size: 11px;
          color: var(--ink-500); letter-spacing: 0.05em;
        }
        .atc-tl-date .num {
          font-family: var(--font-display); font-size: 18px;
          color: var(--ink-900); display: block;
        }
        .atc-tl-items { display: flex; flex-direction: column; gap: 6px; }
        .atc-tl-row {
          display: grid; grid-template-columns: 18px 1fr 90px;
          align-items: center; gap: 8px; padding: 3px 0;
          font-size: 12px;
        }
        .atc-tl-row .lbl { color: var(--ink-800); }
        .atc-tl-row .cat { font-size: 10px; color: var(--ink-500); }
        .atc-tl-amt {
          font-family: var(--font-mono); text-align: right;
          color: var(--ink-800);
        }
        .atc-tl-amt.pos { color: var(--sage-500); }

        /* Month picker */
        .atc-pick-drop {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 100;
          background: var(--cream-50); border: 1px solid var(--line);
          border-radius: 12px; padding: 6px;
          box-shadow: 0 8px 24px var(--shadow-soft);
          min-width: 200px;
          max-height: 320px; overflow-y: auto;
        }
        .atc-pick-btn {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          font-size: 13px; color: var(--ink-700); width: 100%;
          background: transparent; border: none;
        }
        .atc-pick-btn:hover { background: var(--cream-100); }
        .atc-pick-btn.active {
          background: var(--amber-100); color: var(--amber-500); font-weight: 500;
        }

        /* ── Mobile ── */
        @media (max-width: 768px) {
          .atc-main { padding: 14px 14px 14px; gap: 10px; }
          .atc-top { flex-direction: column; align-items: flex-start; gap: 8px; }
          .atc-tool { flex-wrap: wrap; gap: 6px; }
          .atc-btn { padding: 6px 10px; font-size: 11px; }
          /* Hero : grand card pleine largeur, 2 mini-cards par ligne */
          .atc-hero { grid-template-columns: 1fr 1fr; }
          .atc-hero > :first-child { grid-column: 1 / -1; min-height: 130px; }
          .atc-hero-v { font-size: 38px; }
          .atc-hero-v .cur { font-size: 22px; }
          .atc-hero-v .cents { font-size: 18px; }
          /* Body : colonne unique */
          .atc-body { grid-template-columns: 1fr; min-height: 0; }
          /* Catégories : 2 colonnes */
          .atc-cats { grid-template-columns: 1fr 1fr; }
          /* Timeline : réduire la gouttière de date */
          .atc-tl-day { grid-template-columns: 44px 1fr; gap: 8px; }
          .atc-tl-date .num { font-size: 15px; }
          .atc-tl-row { grid-template-columns: 14px 1fr 80px; gap: 6px; }
        }
        @media (max-width: 480px) {
          .atc-hero { grid-template-columns: 1fr; }
          .atc-hero > :first-child { grid-column: auto; }
          .atc-cats { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="atc-top">
        <div>
          <div className="atc-bread">Ambre · <strong>Tableau de bord</strong> · {activeLabel}</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)", margin: "4px 0 0" }}>Bonjour, {firstName}.</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400,
            margin: "4px 0 0", color: "var(--ink-900)", letterSpacing: "-0.01em"
          }}>
            {isCurrentMonth && activeKey === latestKey
              ? <>{todayDay} jours dans le mois, <em style={{ color: "var(--amber-500)" }}>{daysInMonth - todayDay} restants</em>.</>
              : <>Mois terminé · <em style={{ color: "var(--amber-500)" }}>{fmtEUR(totalExp, 0)}</em> dépensés.</>
            }
          </h1>
        </div>
        <div className="atc-tool" style={{ position: "relative" }} ref={pickerRef}>
          <button className="atc-btn" onClick={() => setPickerOpen(v => !v)}>
            <IcCalendar size={14}/>{activeLabel} <IcChevDn size={12}/>
          </button>
          {pickerOpen && (
            <div className="atc-pick-drop">
              {monthly.slice().reverse().map(m => (
                <button key={m.key} className={"atc-pick-btn" + (m.key === activeKey ? " active" : "")}
                  onClick={() => { setSelectedMonthKey(m.key); setPickerOpen(false); }}>
                  <span>{monthKeyLabel(m.key)}</span>
                  <span className="mono" style={{ fontSize:11, opacity:0.6 }}>{fmtEUR(m.exp, 0)}</span>
                </button>
              ))}
            </div>
          )}
          <button className="atc-btn" onClick={() => navigate("/transactions")}><IcSearch size={14}/></button>
          <button className="atc-btn amber" onClick={() => navigate("/import")}>
            <IcUpload size={14}/>Importer
          </button>
        </div>
      </div>

      {/* HERO */}
      <div className="atc-hero">
        <div className="atc-card atc-hero-big">
          <div>
            <div className="atc-hero-l">Dépensé · {activeLabel}</div>
            {(() => {
              const [intPart, decPart] = fmtEUR(totalExp, 2).replace(/\s?€/, "").split(",");
              return (
                <div className="atc-hero-v">
                  <span className="cur">€</span>{intPart}<span className="cents">,{decPart}</span>
                </div>
              );
            })()}
          </div>
          <div className="atc-hero-meta">
            {prev && (
              <span className={"atc-pill " + (expDelta > 0 ? "warn" : "good")}>
                {expDelta > 0 ? <IcArrowUp size={11}/> : <IcArrowDn size={11}/>}
                {expDelta > 0 ? "+" : ""}{Math.round(expDelta * 100)} % vs {prevLabel}
              </span>
            )}
            {totalInc > 0 && (
              <span className={"atc-pill " + (net >= 0 ? "good" : "warn")}>
                Épargne · {Math.round(Math.max(0, net / totalInc) * 100)} %
              </span>
            )}
            {isCurrentMonth && activeKey === latestKey && todayDay > 0 && (
              <span className="atc-pill">Projection · {fmtEUR(totalExp + (totalExp / todayDay) * (daysInMonth - todayDay), 0)}</span>
            )}
          </div>
        </div>

        <div className="atc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="atc-mini-l">Budget mensuel</div>
            <div className="atc-mini-v" style={{ color: pct > 1 ? "var(--rose-500)" : undefined }}>{Math.round(pct * 100)} %</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "-8px 0" }}>
            <RingGauge value={pct} size={130} thickness={10}
                       color={pct > 1 ? "var(--rose-500)" : "var(--amber-500)"}
                       track="rgba(184,105,61,0.12)"/>
          </div>
          <div className={"atc-mini-d " + (pct > 1 ? "atc-delta-up" : "atc-delta-down")}>
            <IcDot size={10}/>
            {pct > 1
              ? `Dépassé de ${fmtEUR(totalExp - budget, 0)}`
              : `${fmtEUR(budget - totalExp, 0)} restants`}
          </div>
        </div>

        <div className="atc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="atc-mini-l">Revenus</div>
            <div className="atc-mini-v">{fmtEUR(totalInc, 0)}</div>
            <div className="atc-mini-d" style={{ color: "var(--ink-500)" }}>
              <IcDot size={10}/>{monthly.length > 1 ? `sur ${monthly.length} mois` : "ce mois"}
            </div>
          </div>
          <Sparkline data={monthly.map(m => m.inc)} color="#6b7a4f" width={220} height={44}/>
        </div>

        <div className="atc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="atc-mini-l">Solde net</div>
            <div className="atc-mini-v" style={{ color: net >= 0 ? "var(--sage-500)" : "var(--rose-500)" }}>
              {net >= 0 ? "+" : ""}{fmtEUR(net, 0)}
            </div>
            {(() => {
              const prevNet = prev ? prev.inc - prev.exp : null;
              const delta   = prevNet != null ? net - prevNet : null;
              const better  = delta != null && delta >= 0;
              return (
                <div className={"atc-mini-d " + (delta == null ? "" : better ? "atc-delta-down" : "atc-delta-up")}>
                  {delta != null
                    ? <>{better ? <IcArrowUp size={11}/> : <IcArrowDn size={11}/>}{better ? "+" : ""}{fmtEUR(delta, 0)} vs {prevLabel}</>
                    : <IcDot size={10}/>}
                </div>
              );
            })()}
          </div>
          <Sparkline data={monthly.map(m => m.inc - m.exp)} color="#b8693d" width={220} height={44}/>
        </div>
      </div>

      {/* BODY */}
      <div className="atc-body">
        <div className="atc-left">
          <div className="atc-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Calendrier des dépenses</div>
                <div className="atc-card-s">intensité par jour · {activeLabel.toLowerCase()}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, color: "var(--ink-500)" }}>
                <span>−</span>
                {[0.15, 0.3, 0.5, 0.7, 0.9].map((o, i) => (
                  <span key={i} style={{ width: 12, height: 8, borderRadius: 2, background: `rgba(184,105,61,${o})` }}/>
                ))}
                <span>+</span>
              </div>
            </div>
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
              fontSize: 9, color: "var(--ink-500)",
              textTransform: "uppercase", letterSpacing: "0.08em", padding: "0 2px"
            }}>
              {["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map(d => <span key={d}>{d}</span>)}
            </div>
            <div className="atc-heat">
              {(() => {
                // Calculate the weekday offset for day 1 (0=Mon..6=Sun)
                const firstDayDate = new Date(yearNum, monthNum - 1, 1);
                const rawDow = firstDayDate.getDay(); // 0=Sun,1=Mon,...6=Sat
                const offset = rawDow === 0 ? 6 : rawDow - 1; // convert to Mon-based
                const cells = [];
                for (let i = 0; i < offset; i++) {
                  cells.push(<div key={"e"+i} className="atc-heat-cell" style={{ visibility: "hidden" }}/>);
                }
                const validExp = dailyExp.filter(v => v != null && v > 0);
                const max = validExp.length > 0 ? Math.max(...validExp) : 1;
                dailyExp.forEach((v, i) => {
                  const day = i + 1;
                  if (v == null) {
                    cells.push(<div key={day} className="atc-heat-cell future">{day}</div>);
                  } else {
                    const o = v > 0 ? 0.15 + (v / max) * 0.75 : 0.05;
                    cells.push(
                      <div key={day}
                           className={"atc-heat-cell" + (isCurrentMonth && day === todayDay ? " today" : "")}
                           style={{ background: `rgba(184,105,61,${o})` }}>
                        {day}
                      </div>
                    );
                  }
                });
                return cells;
              })()}
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 11,
              color: "var(--ink-500)", borderTop: "1px solid var(--line)",
              paddingTop: 10, marginTop: 4
            }}>
              {(() => {
                const validDays = dailyExp.map((v, i) => ({ day: i + 1, v })).filter(x => x.v != null && x.v > 0);
                const worst = validDays.length > 0 ? validDays.reduce((a, b) => b.v > a.v ? b : a) : null;
                const best  = validDays.length > 0 ? validDays.reduce((a, b) => b.v < a.v ? b : a) : null;
                const avg   = validDays.length > 0 ? validDays.reduce((s, x) => s + x.v, 0) / validDays.length : 0;
                return (
                  <>
                    <span>Pire jour · <strong className="mono" style={{ color: "var(--rose-500)" }}>{worst ? worst.day + " " + monthKeyLabel(activeKey).split(" ")[0].toLowerCase() : "—"}</strong></span>
                    <span>Calme · <strong className="mono" style={{ color: "var(--sage-500)" }}>{best ? best.day + " " + monthKeyLabel(activeKey).split(" ")[0].toLowerCase() : "—"}</strong></span>
                    <span>Moyenne · <strong className="mono" style={{ color: "var(--ink-800)" }}>{fmtEUR(avg, 0)}</strong></span>
                  </>
                );
              })()}
            </div>
          </div>

          <div className="atc-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Évolution mensuelle</div>
                <div className="atc-card-s">
                  {chartPeriod === "12 m" ? "12 derniers mois"
                  : chartPeriod === "6 m"  ? "6 derniers mois"
                  : "depuis le début"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {["12 m","6 m","YTD"].map(l => (
                  <button key={l} className="atc-btn" onClick={() => setChartPeriod(l)} style={{
                    padding: "3px 9px", fontSize: 10,
                    background:   l === chartPeriod ? "var(--amber-100)" : undefined,
                    color:        l === chartPeriod ? "var(--amber-500)" : undefined,
                    borderColor:  l === chartPeriod ? "rgba(184,105,61,0.3)" : undefined,
                  }}>{l}</button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <AreaChartLight monthly={monthly} period={chartPeriod}/>
            </div>
          </div>
        </div>

        <div className="atc-right">
          <div className="atc-card">
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Catégories — {activeLabel}</div>
                <div className="atc-card-s">cliquer pour le détail</div>
              </div>
            </div>
            {catTotals.length === 0 ? (
              <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                Aucune dépense ce mois.
              </div>
            ) : (
              <div className="atc-cats">
                {catTotals.slice(0, 6).map(c => {
                  const over      = c.budget > 0 && c.amount > c.budget;
                  const budgetPct = c.budget > 0 ? Math.min(c.amount / c.budget, 1) : 0;
                  return (
                    <div key={c.id} className="atc-cat-card" onClick={() => navigate("/categories")}
                         style={{ cursor: "pointer" }}>
                      <div className="atc-cat-h">
                        <span className="amb-dot" style={{ background: c.color }}/>
                        {c.label}
                      </div>
                      <div className="atc-cat-v">{fmtEUR(c.amount, 0)}</div>
                      {c.budget > 0 && (
                        <div style={{ height: 3, background: "var(--grid-line)", borderRadius: 999 }}>
                          <div style={{
                            width: `${budgetPct * 100}%`, height: "100%", borderRadius: 999,
                            background: over ? "var(--rose-500)" : c.color,
                          }}/>
                        </div>
                      )}
                      <div className="atc-cat-foot">
                        <span>{Math.round(c.share * 100)}% du mois</span>
                        {c.budget > 0 && (
                          <span style={{ color: over ? "var(--rose-500)" : "var(--ink-400)" }}>
                            {over ? `+${fmtEUR(c.amount - c.budget, 0)}` : `/ ${fmtEUR(c.budget, 0)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="atc-card" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Activité récente</div>
                <div className="atc-card-s">10 derniers mouvements</div>
              </div>
              <button className="atc-btn" style={{ padding: "4px 8px", fontSize: 10 }}
                      onClick={() => navigate("/transactions")}>Tout voir →</button>
            </div>
            <div className="atc-tl">
              {recentTxs.length === 0 ? (
                <div style={{ padding: "20px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                  Aucune transaction ce mois.
                </div>
              ) : (() => {
                const grouped = {};
                recentTxs.forEach(t => { (grouped[t.d] = grouped[t.d] || []).push(t); });
                return Object.entries(grouped).slice(0, 4).map(([day, items]) => {
                  const parts = day.split("/");
                  const num = parts[0];
                  const monthShort = parts.length >= 2 ? MONTHS_FR[parseInt(parts[1], 10)] || "" : "";
                  return (
                    <div key={day} className="atc-tl-day">
                      <div className="atc-tl-date">
                        <span className="num">{num}</span>
                        {monthShort}
                      </div>
                      <div className="atc-tl-items">
                        {items.map((t, i) => {
                          const cat = categories.find(c => c.id === t.cat);
                          return (
                            <div key={i} className="atc-tl-row">
                              <span className="amb-dot" style={{ background: cat ? cat.color : "#9d8b73" }}/>
                              <div>
                                <div className="lbl">{t.lbl}</div>
                                <div className="cat">{cat ? cat.label : "Autre"} · {t.mode}</div>
                              </div>
                              <span className={"atc-tl-amt" + (t.amt > 0 ? " pos" : "")}>
                                {t.amt > 0 ? "+" : ""}{fmtEUR(t.amt, 2)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* Aire d'évolution mensuelle utilisée dans le Dashboard */
function AreaChartLight({ monthly, period = "12 m" }) {
  const slice = period === "6 m"  ? monthly.slice(-6)
              : period === "YTD"  ? monthly.filter(m => {
                  const year = m.key ? parseInt(m.key.split("/")[1], 10) : 0;
                  return year === new Date().getFullYear();
                })
              : monthly.slice(-12);

  if (slice.length < 2) {
    return (
      <div style={{ height: 180, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: "var(--ink-500)" }}>
        Pas assez de données pour tracer le graphique.
      </div>
    );
  }

  const expVals = slice.map(m => m.exp);
  const min = Math.min(...expVals) * 0.85;
  const max = Math.max(...expVals) * 1.05;
  const width = 420, height = 180;
  const padX = 30, padY = 18, padR = 14, padB = 24;
  const innerW = width - padX - padR;
  const innerH = height - padY - padB;
  const xs = slice.map((_, i) => padX + (i * innerW) / (slice.length - 1));
  const yOf = v => padY + innerH - ((v - min) / (max - min || 1)) * innerH;
  const pts = xs.map((x, i) => [x, yOf(expVals[i])]);
  const line = pathSmooth(pts);
  const area = `${line} L ${xs[xs.length-1]} ${padY + innerH} L ${xs[0]} ${padY + innerH} Z`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
         style={{ display: "block", width: "100%" }}>
      <defs>
        <linearGradient id="atcArea" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b8693d" stopOpacity="0.22"/>
          <stop offset="100%" stopColor="#b8693d" stopOpacity="0"/>
        </linearGradient>
      </defs>
      {[0, 0.5, 1].map((t, i) => {
        const y = padY + innerH - t * innerH;
        return (
          <g key={i}>
            <line x1={padX} x2={width - padR} y1={y} y2={y} style={{ stroke: "var(--grid-line)" }}/>
            <text x={padX - 6} y={y + 4} textAnchor="end" fontSize="9"
                  fontFamily="var(--font-mono)" style={{ fill: "var(--ink-500)" }}>
              {Math.round(min + t * (max - min)).toLocaleString("fr-FR")}
            </text>
          </g>
        );
      })}
      <path d={area} fill="url(#atcArea)"/>
      <path d={line} fill="none" stroke="#b8693d" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx={xs[xs.length-1]} cy={pts[pts.length-1][1]} r="3.5" fill="#b8693d"/>
      <circle cx={xs[xs.length-1]} cy={pts[pts.length-1][1]} r="7" fill="#b8693d" fillOpacity="0.2"/>
      {slice.map((m, i) => (
        i % 2 === 0 && (
          <text key={i} x={xs[i]} y={height - 6} textAnchor="middle" fontSize="9"
                fontFamily="var(--font-ui)" style={{ fill: "var(--ink-500)" }}>{m.m}</text>
        )
      ))}
    </svg>
  );
}
