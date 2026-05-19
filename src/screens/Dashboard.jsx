/* Dashboard — "Atelier · Clair"
   Vue d'ensemble du mois. Converti du fichier d'origine en composant React modulaire.
   Layout : sidebar (gérée par App) + main (ce composant). */

import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "../lib/storage";
import { useNavigate } from "react-router-dom";
import { CATEGORIES, MONTHLY, TRANSACTIONS } from "../data/mockData";
import {
  Sparkline, RingGauge, fmtEUR, pathSmooth
} from "../lib/chartPrimitives";
import {
  IcCalendar, IcSearch, IcUpload, IcChevDn, IcArrowUp, IcArrowDn, IcDot
} from "../lib/icons";

const MONTH_INFO = [
  { label: "Juin",    year: 2025, full: "Juin 2025"      },
  { label: "Juil.",   year: 2025, full: "Juillet 2025"   },
  { label: "Août",    year: 2025, full: "Août 2025"       },
  { label: "Sept.",   year: 2025, full: "Septembre 2025" },
  { label: "Oct.",    year: 2025, full: "Octobre 2025"   },
  { label: "Nov.",    year: 2025, full: "Novembre 2025"  },
  { label: "Déc.",    year: 2025, full: "Décembre 2025"  },
  { label: "Janv.",   year: 2026, full: "Janvier 2026"   },
  { label: "Févr.",   year: 2026, full: "Février 2026"   },
  { label: "Mars",    year: 2026, full: "Mars 2026"       },
  { label: "Avril",   year: 2026, full: "Avril 2026"     },
  { label: "Mai",     year: 2026, full: "Mai 2026"        },
];

export default function Dashboard() {
  const navigate    = useNavigate();
  const [monthIdx, setMonthIdx]       = useLocalStorage("dash.monthIdx", MONTHLY.length - 1);
  const [pickerOpen, setPickerOpen]   = useState(false);
  const [chartPeriod, setChartPeriod] = useLocalStorage("dash.chartPeriod", "12 m");
  const pickerRef = useRef(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const onDown = e => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [pickerOpen]);

  const info     = MONTH_INFO[monthIdx];
  const current  = MONTHLY[monthIdx];
  const prev     = monthIdx > 0 ? MONTHLY[monthIdx - 1] : null;
  const isLast   = monthIdx === MONTHLY.length - 1;

  const totalExp = current.exp;
  const totalInc = current.inc;
  const net      = totalInc - totalExp;
  const budget   = 2000;
  const pct      = totalExp / budget;
  const expDelta = prev ? (totalExp - prev.exp) / prev.exp : 0;

  const daysInMonth = 31;
  const today = isLast ? 14 : daysInMonth;
  const dailyExp = Array.from({ length: daysInMonth }, (_, i) => {
    if (i >= today) return null;
    const base = 20 + (Math.sin(i * 0.7) + 1) * 30;
    const noise = ((i * 31 + 7) % 11) * 4;
    if (i === 1) return 65;
    if (i === 4) return 95;
    if (i === 8) return 12;
    return base + noise;
  });

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
        .atc-month-picker {
          position: absolute; top: calc(100% + 6px); right: 0; z-index: 100;
          background: var(--cream-50); border: 1px solid var(--line);
          border-radius: 12px; padding: 6px;
          box-shadow: 0 8px 24px var(--shadow-soft);
          min-width: 200px;
          max-height: 320px; overflow-y: auto;
        }
        .atc-month-opt {
          display: flex; justify-content: space-between; align-items: center;
          padding: 8px 12px; border-radius: 8px; cursor: pointer;
          font-size: 13px; color: var(--ink-700);
        }
        .atc-month-opt:hover { background: var(--cream-100); }
        .atc-month-opt.active {
          background: var(--amber-100); color: var(--amber-500); font-weight: 500;
        }
        .atc-month-exp {
          font-family: var(--font-mono); font-size: 11px; color: var(--ink-500);
        }
        .atc-month-opt.active .atc-month-exp { color: var(--amber-400); }
      `}</style>

      <div className="atc-top">
        <div>
          <div className="atc-bread">Ambre · <strong>Tableau de bord</strong> · {info.full}</div>
          <h1 style={{
            fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 400,
            margin: "4px 0 0", color: "var(--ink-900)", letterSpacing: "-0.01em"
          }}>
            {isLast
              ? <>14 jours dans le mois, <em style={{ color: "var(--amber-500)" }}>17 restants</em>.</>
              : <>Mois terminé · <em style={{ color: "var(--amber-500)" }}>{fmtEUR(totalExp, 0)}</em> dépensés.</>
            }
          </h1>
        </div>
        <div className="atc-tool" style={{ position: "relative" }} ref={pickerRef}>
          <button className="atc-btn" onClick={() => setPickerOpen(v => !v)}>
            <IcCalendar size={14}/>{info.full} <IcChevDn size={12}/>
          </button>
          {pickerOpen && (
            <div className="atc-month-picker">
              {[...MONTH_INFO].reverse().map((mi, ri) => {
                const idx = MONTHLY.length - 1 - ri;
                return (
                  <div key={mi.full} className={"atc-month-opt" + (idx === monthIdx ? " active" : "")}
                       onClick={() => { setMonthIdx(idx); setPickerOpen(false); }}>
                    <span>{mi.full}</span>
                    <span className="atc-month-exp">{fmtEUR(MONTHLY[idx].exp, 0)}</span>
                  </div>
                );
              })}
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
            <div className="atc-hero-l">Dépensé · {info.full}</div>
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
                {expDelta > 0 ? "+" : ""}{Math.round(expDelta * 100)} % vs {MONTH_INFO[monthIdx - 1].label}
              </span>
            )}
            {isLast && (
              <span className="atc-pill">Projection · {fmtEUR(totalExp + (totalExp / 14) * 17, 0)}</span>
            )}
          </div>
        </div>

        <div className="atc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="atc-mini-l">Budget mensuel</div>
            <div className="atc-mini-v">{Math.round(pct * 100)} %</div>
          </div>
          <div style={{ display: "flex", justifyContent: "center", margin: "-8px 0" }}>
            <RingGauge value={pct} size={130} thickness={10}
                       color="var(--amber-500)" track="rgba(184,105,61,0.12)"/>
          </div>
          <div className="atc-mini-d atc-delta-down">
            <IcDot size={10}/>{fmtEUR(budget - totalExp, 0)} restants · 17 j
          </div>
        </div>

        <div className="atc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="atc-mini-l">Revenus</div>
            <div className="atc-mini-v">{fmtEUR(totalInc, 0)}</div>
            <div className="atc-mini-d" style={{ color: "var(--ink-500)" }}>
              <IcDot size={10}/>stable depuis 3 mois
            </div>
          </div>
          <Sparkline data={MONTHLY.map(m => m.inc)} color="#6b7a4f" width={220} height={44}/>
        </div>

        <div className="atc-card" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div className="atc-mini-l">Solde net</div>
            <div className="atc-mini-v" style={{ color: "var(--sage-500)" }}>+{fmtEUR(net, 0)}</div>
            <div className="atc-mini-d atc-delta-up"><IcArrowDn size={11}/>−110 € vs avril</div>
          </div>
          <Sparkline data={MONTHLY.map(m => m.inc - m.exp)} color="#b8693d" width={220} height={44}/>
        </div>
      </div>

      {/* BODY */}
      <div className="atc-body">
        <div className="atc-left">
          <div className="atc-card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Calendrier des dépenses</div>
                <div className="atc-card-s">intensité par jour · {info.full.toLowerCase()}</div>
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
                const offset = 4;
                const cells = [];
                for (let i = 0; i < offset; i++) {
                  cells.push(<div key={"e"+i} className="atc-heat-cell" style={{ visibility: "hidden" }}/>);
                }
                const max = Math.max(...dailyExp.filter(v => v != null));
                dailyExp.forEach((v, i) => {
                  const day = i + 1;
                  if (v == null) {
                    cells.push(<div key={day} className="atc-heat-cell future">{day}</div>);
                  } else {
                    const o = 0.15 + (v / max) * 0.75;
                    cells.push(
                      <div key={day}
                           className={"atc-heat-cell" + (day === today ? " today" : "")}
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
              <span>Pire jour · <strong className="mono" style={{ color: "var(--rose-500)" }}>13 mai (loyer)</strong></span>
              <span>Calme · <strong className="mono" style={{ color: "var(--sage-500)" }}>9 mai</strong></span>
              <span>Moyenne · <strong className="mono" style={{ color: "var(--ink-800)" }}>124 €</strong></span>
            </div>
          </div>

          <div className="atc-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Évolution mensuelle</div>
                <div className="atc-card-s">
                  {chartPeriod === "12 m" ? "12 derniers mois"
                  : chartPeriod === "6 m"  ? "6 derniers mois"
                  : "2026 · janvier → mai"}
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
              <AreaChartLight period={chartPeriod}/>
            </div>
          </div>
        </div>

        <div className="atc-right">
          <div className="atc-card">
            <div className="atc-card-h">
              <div>
                <div className="atc-card-t">Catégories — mai 2026</div>
                <div className="atc-card-s">cliquer pour le détail</div>
              </div>
            </div>
            <div className="atc-cats">
              {CATEGORIES.slice(0, 6).map(c => (
                <div key={c.id} className="atc-cat-card" onClick={() => navigate("/categories")}
                     style={{ cursor: "pointer" }}>
                  <div className="atc-cat-h">
                    <span className="amb-dot" style={{ background: c.color }}/>
                    {c.label}
                  </div>
                  <div className="atc-cat-v">{fmtEUR(c.amount, 0)}</div>
                  <Sparkline
                    data={Array.from({ length: 8 }, (_, i) =>
                      c.amount * (0.6 + Math.abs(Math.sin(i * 0.9 + c.id.charCodeAt(0))) * 0.7)
                    )}
                    color={c.color} width={180} height={26}/>
                  <div className="atc-cat-foot">
                    <span>{Math.round(c.share * 100)}% du mois</span>
                    <span style={{
                      color: c.trend > 0 ? "var(--rose-500)"
                           : c.trend < 0 ? "var(--sage-500)"
                                          : "var(--ink-500)"
                    }}>
                      {c.trend > 0 ? "+" : ""}{(c.trend * 100).toFixed(0)} %
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
              {(() => {
                const grouped = {};
                TRANSACTIONS.forEach(t => { (grouped[t.d] = grouped[t.d] || []).push(t); });
                return Object.entries(grouped).slice(0, 4).map(([day, items]) => {
                  const [num, mo] = day.split(" ");
                  return (
                    <div key={day} className="atc-tl-day">
                      <div className="atc-tl-date">
                        <span className="num">{num}</span>
                        {mo}
                      </div>
                      <div className="atc-tl-items">
                        {items.map((t, i) => {
                          const cat = CATEGORIES.find(c => c.id === t.cat);
                          return (
                            <div key={i} className="atc-tl-row">
                              <span className="amb-dot" style={{ background: cat ? cat.color : "var(--sage-500)" }}/>
                              <div>
                                <div className="lbl">{t.label}</div>
                                <div className="cat">{cat ? cat.label : "Revenus"} · {t.mode}</div>
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
function AreaChartLight({ period = "12 m" }) {
  const slice = period === "6 m" ? MONTHLY.slice(-6)
              : period === "YTD" ? MONTHLY.filter((_, i) => i >= 7)
              : MONTHLY;
  const expVals = slice.map(m => m.exp);
  const min = Math.min(...expVals) * 0.85;
  const max = Math.max(...expVals) * 1.05;
  const width = 420, height = 180;
  const padX = 30, padY = 18, padR = 14, padB = 24;
  const innerW = width - padX - padR;
  const innerH = height - padY - padB;
  const xs = slice.map((_, i) => padX + (i * innerW) / (slice.length - 1));
  const yOf = v => padY + innerH - ((v - min) / (max - min)) * innerH;
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
