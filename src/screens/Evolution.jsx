/* Écran Évolution mensuelle — Vue panoramique des dépenses/revenus dans le temps.
   - Grand graphique hero : dépenses + revenus + année précédente (12 mois)
   - Table de comparaison année par année (Mai 2025 vs Mai 2026)
   - Small multiples : un sparkline par catégorie */

import { CATEGORIES, MONTHLY } from "../data/mockData";
import { fmtEUR, pathSmooth, Sparkline } from "../lib/chartPrimitives";
import { IcCalendar, IcChevDn } from "../lib/icons";

export default function Evolution() {
  // Année précédente (faked à partir de MONTHLY)
  const previousYear = MONTHLY.map((m, i) => ({
    ...m,
    exp: m.exp * (0.85 + Math.abs(Math.sin(i * 1.3)) * 0.1)
  }));

  // Séries par catégorie sur 12 mois (variance basée sur l'id)
  const catSeries = CATEGORIES.map(c => ({
    ...c,
    values: MONTHLY.map((_, i) =>
      c.amount * (0.7 + Math.abs(Math.sin(i * 0.8 + c.id.charCodeAt(0))) * 0.6)
    )
  }));

  const totalExp = MONTHLY.reduce((s, m) => s + m.exp, 0);
  const totalInc = MONTHLY.reduce((s, m) => s + m.inc, 0);
  const totalNet = totalInc - totalExp;

  return (
    <main className="ev-main">
      <style>{EV_STYLES}</style>

      <div className="ev-top">
        <div>
          <div className="ev-bread">Ambre · <strong>Évolution mensuelle</strong></div>
          <h1 className="ev-h1">Vos finances dans le <em>temps</em>.</h1>
        </div>
        <div className="ev-tool">
          <div className="ev-seg">
            <button>6 m</button>
            <button className="active">12 m</button>
            <button>24 m</button>
            <button>YTD</button>
            <button>2025 vs 2026</button>
          </div>
          <button className="ev-btn">
            <IcCalendar size={14}/>Mai 2025 → Mai 2026 <IcChevDn size={12}/>
          </button>
        </div>
      </div>

      {/* HERO CHART */}
      <div className="ev-hero">
        <div className="ev-hero-head">
          <div>
            <div className="ev-card-t">Dépenses, revenus et solde net · 12 derniers mois</div>
            <div className="ev-card-s">
              Total dépensé · <strong style={{ color: "var(--ink-800)" }}>{fmtEUR(totalExp, 0)}</strong>
              {" · "}
              Total perçu · <strong style={{ color: "var(--ink-800)" }}>{fmtEUR(totalInc, 0)}</strong>
              {" · "}
              Solde · <strong style={{ color: "var(--sage-500)" }}>+{fmtEUR(totalNet, 0)}</strong>
            </div>
          </div>
          <div className="ev-legend">
            <span><span style={{ width: 14, height: 2, background: "var(--amber-500)" }}/>Dépenses</span>
            <span><span style={{ width: 14, height: 2, background: "var(--sage-500)" }}/>Revenus</span>
            <span><span style={{ width: 14, height: 0, borderTop: "1.5px dashed var(--ink-500)" }}/>Année précédente</span>
          </div>
        </div>
        <EvolutionHeroChart months={MONTHLY} prev={previousYear}/>
      </div>

      {/* BOTTOM — comparison + small multiples */}
      <div className="ev-bot">
        {/* Comparison table */}
        <div className="ev-card">
          <div className="ev-hero-head">
            <div>
              <div className="ev-card-t">Mai 2026 vs Mai 2025</div>
              <div className="ev-card-s">comparaison d'une année à l'autre</div>
            </div>
            <span className="amb-chip" style={{
              color: "var(--sage-500)",
              background: "rgba(107,122,79,0.08)",
              borderColor: "rgba(107,122,79,0.35)"
            }}>
              Globalement −3 %
            </span>
          </div>
          <div className="ev-cmp-row head">
            <span>Catégorie</span>
            <span style={{ textAlign: "right" }}>2025</span>
            <span style={{ textAlign: "right" }}>2026</span>
            <span style={{ textAlign: "right" }}>Δ</span>
          </div>
          <div style={{ overflow: "auto" }}>
            {CATEGORIES.map(c => {
              const last = c.amount * (0.88 + (c.id.charCodeAt(0) % 7) * 0.04);
              const delta = (c.amount - last) / last;
              return (
                <div key={c.id} className="ev-cmp-row">
                  <span className="ev-cmp-l">
                    <span className="amb-dot" style={{ background: c.color }}/>
                    {c.label}
                  </span>
                  <span className="ev-cmp-v">{fmtEUR(last, 0)}</span>
                  <span className="ev-cmp-v">{fmtEUR(c.amount, 0)}</span>
                  <span className={"ev-cmp-d " + (Math.abs(delta) < 0.01 ? "flat" : delta > 0 ? "up" : "down")}>
                    {Math.abs(delta) < 0.01
                      ? "—"
                      : `${delta > 0 ? "+" : ""}${(delta * 100).toFixed(0)} %`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Small multiples */}
        <div className="ev-card">
          <div className="ev-hero-head">
            <div>
              <div className="ev-card-t">Évolution par catégorie</div>
              <div className="ev-card-s">12 mois · échelle propre à chaque catégorie</div>
            </div>
            <div className="ev-seg">
              <button className="active">Mensuel</button>
              <button>Cumulé</button>
            </div>
          </div>
          <div className="ev-grid">
            {catSeries.map(c => {
              const max = Math.max(...c.values);
              const cur = c.values[c.values.length - 1];
              const prev = c.values[c.values.length - 2];
              const delta = (cur - prev) / prev;
              return (
                <div key={c.id} className="ev-tile">
                  <div className="ev-tile-h">
                    <div className="ev-tile-name">
                      <span className="amb-dot" style={{ background: c.color }}/>
                      {c.label}
                    </div>
                    <span className={"ev-tile-pct " + (delta > 0 ? "up" : delta < 0 ? "down" : "")}>
                      {delta > 0 ? "↑" : delta < 0 ? "↓" : "—"} {Math.abs(delta * 100).toFixed(0)} %
                    </span>
                  </div>
                  <div className="ev-tile-v">{fmtEUR(cur, 0)}</div>
                  <Sparkline data={c.values} color={c.color} width={260} height={42}/>
                  <div style={{
                    fontSize: 10, color: "var(--ink-500)", fontFamily: "var(--font-mono)",
                    display: "flex", justifyContent: "space-between"
                  }}>
                    <span>min · {fmtEUR(Math.min(...c.values), 0)}</span>
                    <span>max · {fmtEUR(max, 0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}

/* Graphique hero — dépenses + revenus + année précédente */
function EvolutionHeroChart({ months, prev }) {
  const width = 1320, height = 230;
  const padX = 44, padY = 18, padR = 18, padB = 26;
  const innerW = width - padX - padR;
  const innerH = height - padY - padB;
  const allVals = months.flatMap(m => [m.exp, m.inc]).concat(prev.map(p => p.exp));
  const min = Math.min(...allVals) * 0.85;
  const max = Math.max(...allVals) * 1.05;
  const xs = months.map((_, i) => padX + (i * innerW) / (months.length - 1));
  const yOf = v => padY + innerH - ((v - min) / (max - min)) * innerH;
  const expPts = xs.map((x, i) => [x, yOf(months[i].exp)]);
  const incPts = xs.map((x, i) => [x, yOf(months[i].inc)]);
  const prevPts = xs.map((x, i) => [x, yOf(prev[i].exp)]);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none"
         style={{ height: 280 }}>
      <defs>
        <linearGradient id="evGrad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#b8693d" stopOpacity="0.10"/>
          <stop offset="100%" stopColor="#b8693d" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Horizontal grid */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padY + innerH - t * innerH;
        return (
          <g key={i}>
            <line x1={padX} x2={width - padR} y1={y} y2={y} stroke="rgba(61,40,23,0.07)"/>
            <text x={padX - 8} y={y + 4} textAnchor="end" fontSize="10"
                  fontFamily="var(--font-mono)" fill="rgba(61,40,23,0.5)">
              {Math.round(min + t * (max - min))} €
            </text>
          </g>
        );
      })}

      {/* Année précédente (pointillé) */}
      <path d={pathSmooth(prevPts)} fill="none" stroke="var(--ink-500)" strokeWidth="1.2"
            strokeDasharray="3 4" opacity="0.7"/>

      {/* Aire dépenses */}
      <path d={`${pathSmooth(expPts)} L ${xs[xs.length-1]} ${padY + innerH} L ${xs[0]} ${padY + innerH} Z`}
            fill="url(#evGrad)"/>
      <path d={pathSmooth(expPts)} fill="none" stroke="#b8693d" strokeWidth="2" strokeLinecap="round"/>

      {/* Ligne revenus */}
      <path d={pathSmooth(incPts)} fill="none" stroke="#6b7a4f" strokeWidth="1.8" strokeLinecap="round"/>

      {/* Marqueurs du mois courant */}
      <circle cx={expPts[expPts.length - 1][0]} cy={expPts[expPts.length - 1][1]} r="4"
              fill="#b8693d" stroke="var(--cream-50)" strokeWidth="2"/>
      <circle cx={incPts[incPts.length - 1][0]} cy={incPts[incPts.length - 1][1]} r="4"
              fill="#6b7a4f" stroke="var(--cream-50)" strokeWidth="2"/>

      {/* Annotation décembre (pic) */}
      <line x1={xs[6]} y1={expPts[6][1] - 6} x2={xs[6]} y2={padY + 4}
            stroke="rgba(61,40,23,0.3)" strokeDasharray="2 3"/>
      <text x={xs[6]} y={padY - 2} textAnchor="middle" fontSize="10"
            fontFamily="var(--font-mono)" fill="var(--ink-700)">
        pic · déc. {fmtEUR(months[6].exp, 0)}
      </text>

      {/* Labels des mois */}
      {months.map((m, i) => (
        <text key={i} x={xs[i]} y={height - 6} textAnchor="middle" fontSize="10"
              fontFamily="var(--font-ui)" fill="rgba(61,40,23,0.5)">{m.m}</text>
      ))}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────────────────────────── */
const EV_STYLES = `
  .ev-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px;
             height: 100%; overflow: auto;
             background: #efe7d6; color: var(--ink-800); font-size: 13px; }
  .ev-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; }
  .ev-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .ev-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .ev-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
           color: var(--ink-900); letter-spacing: -0.01em; }
  .ev-h1 em { font-style: italic; color: var(--amber-500); }
  .ev-tool { display: flex; gap: 8px; align-items: center; }
  .ev-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
            border: 1px solid var(--line); border-radius: 8px;
            background: var(--cream-50); color: var(--ink-700);
            font-size: 12px; cursor: pointer; }
  .ev-seg { display: flex; padding: 3px; background: var(--cream-50);
            border: 1px solid var(--line); border-radius: 9px; gap: 2px; }
  .ev-seg button { padding: 5px 11px; border-radius: 6px; font-size: 12px;
                   color: var(--ink-600); background: transparent; border: none; cursor: pointer; }
  .ev-seg button.active { background: var(--cream-200); color: var(--ink-800); font-weight: 500; }

  .ev-hero { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
             padding: 20px 22px 8px; display: flex; flex-direction: column; gap: 12px; }
  .ev-hero-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; }
  .ev-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .ev-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
  .ev-legend { display: flex; gap: 12px; font-size: 11px; color: var(--ink-700); flex-shrink: 0; }
  .ev-legend > span { display: flex; align-items: center; gap: 6px; }

  .ev-bot { display: grid; grid-template-columns: 1.05fr 1.95fr; gap: 14px;
            min-height: 0; }
  .ev-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
             padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }

  /* Tableau comparaison */
  .ev-cmp-row { display: grid; grid-template-columns: 1fr 90px 90px 80px;
                align-items: center; gap: 10px; padding: 9px 0;
                border-bottom: 1px dashed var(--line); }
  .ev-cmp-row.head { color: var(--ink-500); font-size: 10px;
                     letter-spacing: 0.08em; text-transform: uppercase;
                     padding: 4px 0 8px; border-bottom: 1px solid var(--line); }
  .ev-cmp-row:last-child { border-bottom: none; }
  .ev-cmp-l { font-size: 13px; color: var(--ink-800); display: flex; align-items: center; gap: 8px; }
  .ev-cmp-v { font-family: var(--font-mono); font-size: 12.5px; text-align: right; color: var(--ink-800); }
  .ev-cmp-d { font-family: var(--font-mono); font-size: 11px; text-align: right; }
  .ev-cmp-d.up   { color: var(--rose-500); }
  .ev-cmp-d.down { color: var(--sage-500); }
  .ev-cmp-d.flat { color: var(--ink-500); }

  /* Small multiples */
  .ev-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
             flex: 1; min-height: 0; }
  .ev-tile { background: var(--cream-100); border: 1px solid var(--line); border-radius: 10px;
             padding: 12px 14px; display: flex; flex-direction: column; gap: 6px; }
  .ev-tile-h { display: flex; align-items: flex-start; justify-content: space-between; }
  .ev-tile-name { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--ink-700); }
  .ev-tile-pct { font-family: var(--font-mono); font-size: 10px; }
  .ev-tile-pct.up { color: var(--rose-500); }
  .ev-tile-pct.down { color: var(--sage-500); }
  .ev-tile-v { font-family: var(--font-display); font-size: 19px;
               color: var(--ink-900); line-height: 1; }
`;
