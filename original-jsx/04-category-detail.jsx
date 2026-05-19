/* Écran — Vue par catégorie (drill-down sur Alimentation)
   1440 × 900. Header catégorie, KPIs, courbe d'évolution,
   sous-catégories + top marchands, transactions filtrées. */

function ScreenCategoryDetail() {
  const { TRANSACTIONS } = window.AMBRE_DATA;
  const cat = { id: "alim", label: "Alimentation", color: "#b8693d",
                desc: "Courses, marchés, boulangerie, restaurants, livraisons" };

  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, active: true, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  // 12 mois de dépenses Alimentation
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
    { name: "Carrefour Market",  n: 6, sum: 184.20 },
    { name: "Auchan Drive",      n: 2, sum: 164.80 },
    { name: "Monoprix",          n: 4, sum:  81.95 },
    { name: "Boulangerie Pichon", n: 5, sum: 41.80 },
    { name: "Le Petit Café",     n: 3, sum:  14.20 },
  ];

  const txInCat = TRANSACTIONS.filter(t => t.cat === "alim");

  return (
    <div className="cd-root">
      <style>{`
        .cd-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        .cd-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .cd-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .cd-nav-btn { width: 40px; height: 40px; border-radius: 10px;
                      display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .cd-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .cd-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .cd-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .cd-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
        .cd-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .cd-bread .crumb-link { cursor: pointer; }
        .cd-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }

        .cd-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .cd-h-left { display: flex; align-items: center; gap: 16px; }
        .cd-mark { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
                   color: var(--cream-50); font-family: var(--font-display); font-style: italic; font-size: 26px; }
        .cd-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: var(--ink-900);
                 letter-spacing: -0.01em; line-height: 1; }
        .cd-h-desc { font-size: 12px; color: var(--ink-500); margin-top: 5px; }
        .cd-tool { display: flex; gap: 8px; align-items: center; }
        .cd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }

        .cd-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .cd-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                   padding: 16px 18px; display: flex; flex-direction: column; gap: 4px; }
        .cd-card-l { font-size: 10px; color: var(--ink-500); letter-spacing: 0.08em; text-transform: uppercase; }
        .cd-card-v { font-family: var(--font-display); font-size: 26px; color: var(--ink-900); line-height: 1.1; margin-top: 4px; }
        .cd-card-s { font-size: 11px; color: var(--ink-500); }
        .cd-delta-up { color: var(--rose-500); }
        .cd-delta-down { color: var(--sage-500); }

        .cd-chart-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                         padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
        .cd-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
        .cd-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .cd-card-ss { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .cd-bot { display: grid; grid-template-columns: 1fr 1fr 1.4fr; gap: 12px; flex: 1; min-height: 0; }
        .cd-bot .cd-card { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }

        .cd-bar-row { padding: 8px 0; border-bottom: 1px dashed var(--line); }
        .cd-bar-row:last-child { border-bottom: none; }
        .cd-bar-meta { display: flex; align-items: center; justify-content: space-between; font-size: 12.5px; margin-bottom: 6px; }
        .cd-bar-meta .pct { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
        .cd-bar-meta .amt { font-family: var(--font-mono); font-size: 12px; color: var(--ink-800); }
        .cd-bar { height: 5px; background: rgba(61,40,23,0.06); border-radius: 999px; overflow: hidden; }

        .cd-merch-row { display: grid; grid-template-columns: 32px 1fr auto auto; align-items: center; gap: 10px;
                        padding: 9px 0; border-bottom: 1px dashed var(--line); }
        .cd-merch-row:last-child { border-bottom: none; }
        .cd-merch-mark { width: 32px; height: 32px; border-radius: 8px; background: var(--cream-200);
                         font-family: var(--font-display); font-style: italic; font-size: 16px; color: var(--ink-700);
                         display: flex; align-items: center; justify-content: center; }
        .cd-merch-name { font-size: 13px; color: var(--ink-800); }
        .cd-merch-n { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }
        .cd-merch-sum { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-800); font-weight: 500; }

        .cd-tx-row { display: grid; grid-template-columns: 60px 1fr 90px; align-items: center; gap: 12px;
                     padding: 9px 0; border-bottom: 1px dashed var(--line); }
        .cd-tx-row:last-child { border-bottom: none; }
        .cd-tx-date { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
        .cd-tx-amt { font-family: var(--font-mono); text-align: right; color: var(--ink-800); font-weight: 500; font-size: 12.5px; }
      `}</style>

      <aside className="cd-side">
        <div className="cd-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"cd-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="cd-side-foot">
          <div className="cd-nav-btn"><IcSun size={18}/></div>
          <div className="cd-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="cd-main">
        <div className="cd-bread">
          <span className="crumb-link">Catégories</span>
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
            <button className="cd-btn"><IcSettings size={14}/>Modifier la catégorie</button>
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
              <button className="cd-btn" style={{ padding: "3px 9px", fontSize: 11, background: "var(--amber-100)", color: "var(--amber-500)", borderColor: "rgba(184,105,61,0.3)" }}>12 m</button>
              <button className="cd-btn" style={{ padding: "3px 9px", fontSize: 11 }}>6 m</button>
              <button className="cd-btn" style={{ padding: "3px 9px", fontSize: 11 }}>YTD</button>
            </div>
          </div>
          <CategoryEvolutionChart months={months} values={series} color={cat.color}/>
        </div>

        {/* BOT */}
        <div className="cd-bot">
          <div className="cd-card">
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
                  <div className="cd-bar"><div style={{ width: `${s.share * 100}%`, height: "100%", background: s.color, borderRadius: 999 }}/></div>
                </div>
              ))}
            </div>
          </div>

          <div className="cd-card">
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

          <div className="cd-card">
            <div className="cd-card-h">
              <div>
                <div className="cd-card-t">Transactions · Alimentation</div>
                <div className="cd-card-ss">14 mouvements ce mois</div>
              </div>
              <button className="cd-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Voir tout <IcArrowR size={11}/></button>
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
    </div>
  );
}

function CategoryEvolutionChart({ months, values, color }) {
  const width = 1280, height = 160;
  const padX = 36, padY = 18, padR = 18, padB = 22;
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
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" style={{ height: 180 }}>
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
      {/* avg line */}
      <line x1={padX} x2={width - padR} y1={avgY} y2={avgY} stroke="var(--ink-500)" strokeDasharray="3 4"/>
      <text x={width - padR - 4} y={avgY - 4} textAnchor="end" fontSize="10"
            fontFamily="var(--font-mono)" fill="var(--ink-500)">moyenne · {Math.round(avg)} €</text>
      {/* dots */}
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

window.ScreenCategoryDetail = ScreenCategoryDetail;
