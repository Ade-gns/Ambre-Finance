/* Écran — Vue catégorie en état vide (Éducation, jamais utilisée ce mois)
   1440 × 900. Même shell que category-detail mais avec un grand vide invitant à créer une règle. */

function ScreenCategoryEmpty() {
  const cat = { id: "edu", label: "Éducation", color: "#7a5c3a",
                desc: "Frais de scolarité, livres, cours en ligne, abonnements éducatifs" };

  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, active: true, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  // Suggestions: transactions non classées qui pourraient appartenir à cette cat
  const suggestions = [
    { d: "11/05", lbl: "Udemy.com — Subscription",    sub: "PAIEMENT PAR CARTE",        cur: "abo",  amt: -16.99 },
    { d: "04/05", lbl: "Fnac.com",                    sub: "Livre · Sapiens",           cur: "loi",  amt: -22.50 },
    { d: "28/04", lbl: "Coursera Plus",               sub: "ABONNEMENT MENSUEL",        cur: "abo",  amt: -49.00 },
  ];

  return (
    <div className="ce-root">
      <style>{`
        .ce-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        .ce-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .ce-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .ce-nav-btn { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .ce-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .ce-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .ce-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .ce-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 18px; overflow: hidden; }
        .ce-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .ce-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ce-bread .crumb-link { cursor: pointer; }

        .ce-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .ce-h-left { display: flex; align-items: center; gap: 16px; }
        .ce-mark { width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center;
                   color: var(--cream-50); font-family: var(--font-display); font-style: italic; font-size: 26px; }
        .ce-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; color: var(--ink-900);
                 letter-spacing: -0.01em; line-height: 1; }
        .ce-h-desc { font-size: 12px; color: var(--ink-500); margin-top: 5px; }
        .ce-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }

        /* KPI ghosts */
        .ce-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .ce-kpi { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                  padding: 16px 18px; opacity: 0.7; }
        .ce-kpi-l { font-size: 10px; color: var(--ink-500); letter-spacing: 0.08em; text-transform: uppercase; }
        .ce-kpi-v { font-family: var(--font-display); font-size: 26px; color: var(--ink-400); margin-top: 4px; }
        .ce-kpi-s { font-size: 11px; color: var(--ink-500); margin-top: 4px; font-family: var(--font-mono); }

        /* Hero empty */
        .ce-hero { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.1fr 1fr; gap: 14px; }
        .ce-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   padding: 22px 26px; display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
        .ce-hero-empty { background: var(--cream-50); border: 1.5px dashed rgba(122,92,58,0.4);
                         border-radius: 14px; padding: 36px; display: flex; flex-direction: column;
                         align-items: center; justify-content: center; gap: 14px; text-align: center;
                         position: relative; overflow: hidden; }
        .ce-hero-empty::before { content: ""; position: absolute; inset: 0; opacity: 0.6;
                                 background-image: radial-gradient(circle at 50% 0%, rgba(122,92,58,0.06), transparent 60%); }
        .ce-hero-empty > * { position: relative; z-index: 1; }
        .ce-empty-ico { width: 64px; height: 64px; border-radius: 16px;
                        background: rgba(122,92,58,0.10); color: ${cat.color};
                        display: flex; align-items: center; justify-content: center; }
        .ce-empty-t { font-family: var(--font-display); font-size: 30px; line-height: 1.1;
                      color: var(--ink-900); letter-spacing: -0.01em; max-width: 460px; }
        .ce-empty-t em { font-style: italic; color: ${cat.color}; }
        .ce-empty-s { font-size: 13.5px; color: var(--ink-600); line-height: 1.55; max-width: 480px; }
        .ce-empty-actions { display: flex; gap: 10px; margin-top: 6px; }
        .ce-empty-actions button { padding: 9px 16px; border-radius: 9px; font-size: 13px; }
        .ce-empty-actions .primary { background: ${cat.color}; color: var(--cream-50); border: 1px solid ${cat.color}; font-weight: 500; }

        /* Calendar / sparkline ghost */
        .ce-trend { padding-top: 16px; border-top: 1px solid var(--line); margin-top: 8px;
                    display: flex; align-items: center; justify-content: space-between; }
        .ce-trend-l { font-size: 11px; color: var(--ink-500); }
        .ce-trend-flat { height: 24px; flex: 1; margin: 0 18px; position: relative; }
        .ce-trend-flat::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 1px;
                                background: var(--line); border-top: 1px dashed var(--line-strong); }

        /* Suggestions */
        .ce-card-h { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
        .ce-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ce-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .ce-sg-row { display: grid; grid-template-columns: 56px 1fr 100px 90px; align-items: center; gap: 10px;
                     padding: 11px 0; border-bottom: 1px dashed var(--line); }
        .ce-sg-row:last-child { border-bottom: none; }
        .ce-sg-date { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
        .ce-sg-lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ce-sg-sub { font-size: 10.5px; color: var(--ink-500); font-family: var(--font-mono); margin-top: 2px;
                     letter-spacing: 0.04em; text-transform: uppercase; }
        .ce-sg-cur { font-size: 10.5px; padding: 3px 9px; border-radius: 999px; border: 1px dashed var(--line-strong);
                     color: var(--ink-500); display: inline-flex; align-items: center; gap: 5px; justify-self: start; }
        .ce-sg-act { display: flex; gap: 4px; justify-content: flex-end; }
        .ce-sg-act button { padding: 4px 8px; font-size: 10.5px; }

        .ce-rule-tip { background: rgba(122,92,58,0.08); border: 1px solid rgba(122,92,58,0.25);
                       border-radius: 10px; padding: 14px; display: flex; gap: 12px; align-items: flex-start;
                       margin-top: 12px; }
        .ce-rule-tip-ico { width: 28px; height: 28px; border-radius: 7px;
                           background: var(--cream-50); display: flex; align-items: center; justify-content: center;
                           color: ${cat.color}; flex-shrink: 0; }
        .ce-rule-tip-t { font-size: 12.5px; color: var(--ink-900); font-weight: 500; }
        .ce-rule-tip-s { font-size: 11.5px; color: var(--ink-600); margin-top: 3px; line-height: 1.5; }
      `}</style>

      <aside className="ce-side">
        <div className="ce-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"ce-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="ce-side-foot">
          <div className="ce-nav-btn"><IcSun size={18}/></div>
          <div className="ce-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="ce-main">
        <div className="ce-bread">
          <span className="crumb-link">Catégories</span>
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

        {/* HERO */}
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
              de classement automatique pour les prochains relevés&nbsp;?
            </div>
            <div className="ce-empty-actions">
              <button className="primary"><IcPlus size={14} style={{ marginRight: 6 }}/>Ajouter une transaction</button>
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
                    <button className="ce-btn" style={{ background: cat.color, color: "var(--cream-50)", borderColor: cat.color }}>
                      → Éducation
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="ce-rule-tip">
              <div className="ce-rule-tip-ico">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
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
    </div>
  );
}

window.ScreenCategoryEmpty = ScreenCategoryEmpty;
