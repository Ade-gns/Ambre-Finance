/* Écran — Import réussi (après confirmation)
   1440 × 900. Confirmation, récap et prochaines étapes. */

function ScreenImportSuccess() {
  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, active: true, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  const recap = [
    { id: "loy",  label: "Logement",      color: "#3d2817", count: 1,  sum: 920.00 },
    { id: "alim", label: "Alimentation",  color: "#b8693d", count: 14, sum: 432.60 },
    { id: "tra",  label: "Transports",    color: "#6b7a4f", count: 5,  sum: 167.80 },
    { id: "loi",  label: "Loisirs",       color: "#a85a48", count: 8,  sum: 142.30 },
    { id: "abo",  label: "Abonnements",   color: "#cd8459", count: 4,  sum: 54.99 },
    { id: "san",  label: "Santé",         color: "#9d8b73", count: 2,  sum: 77.50 },
  ];

  return (
    <div className="su-root">
      <style>{`
        .su-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        .su-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .su-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .su-nav-btn { width: 40px; height: 40px; border-radius: 10px;
                      display: flex; align-items: center; justify-content: center; color: var(--ink-500); position: relative; }
        .su-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .su-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .su-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .su-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 18px; overflow: hidden; }
        .su-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .su-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }

        /* HERO */
        .su-hero { background: var(--cream-50); border: 1px solid var(--line); border-radius: 16px;
                   padding: 48px 56px; display: grid; grid-template-columns: 100px 1fr auto;
                   gap: 32px; align-items: center; position: relative; overflow: hidden; }
        .su-hero::before { content: ""; position: absolute; inset: 0; opacity: 0.5;
                           background-image: radial-gradient(circle at 90% 50%, rgba(107,122,79,0.08), transparent 60%); }
        .su-hero > * { position: relative; z-index: 1; }
        .su-check { width: 80px; height: 80px; border-radius: 50%;
                    background: linear-gradient(135deg, #9aaa7d, #6b7a4f); color: var(--cream-50);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 20px rgba(107,122,79,0.25); }
        .su-hero-l { font-size: 11px; color: var(--sage-500); letter-spacing: 0.1em; text-transform: uppercase;
                     display: flex; align-items: center; gap: 8px; }
        .su-hero-h { font-family: var(--font-display); font-size: 44px; line-height: 1.05; color: var(--ink-900);
                     letter-spacing: -0.02em; margin: 6px 0 4px; font-weight: 400; }
        .su-hero-h em { font-style: italic; color: var(--sage-500); }
        .su-hero-s { font-size: 14px; color: var(--ink-600); line-height: 1.5; max-width: 540px; }
        .su-hero-meta { display: flex; gap: 16px; margin-top: 12px; font-size: 11px; color: var(--ink-500); }
        .su-hero-meta strong { color: var(--ink-800); font-family: var(--font-mono); font-weight: 500; }

        .su-hero-actions { display: flex; flex-direction: column; gap: 8px; align-items: stretch; min-width: 220px; }
        .su-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
                  border: 1px solid var(--line); border-radius: 9px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 13px; justify-content: center; }
        .su-btn.primary { background: var(--ink-800); color: var(--cream-50); border-color: var(--ink-800); font-weight: 500; }
        .su-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        /* Stats row */
        .su-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .su-stat { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                   padding: 14px 18px; display: flex; flex-direction: column; gap: 4px; }
        .su-stat-l { font-size: 10px; color: var(--ink-500); letter-spacing: 0.08em; text-transform: uppercase; }
        .su-stat-v { font-family: var(--font-display); font-size: 26px; color: var(--ink-900); line-height: 1.1; margin-top: 4px; }
        .su-stat-s { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }

        /* Bottom */
        .su-bot { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; flex: 1; min-height: 0; }
        .su-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   display: flex; flex-direction: column; overflow: hidden; }
        .su-card-h { padding: 16px 20px 12px; border-bottom: 1px solid var(--line);
                     display: flex; align-items: flex-start; justify-content: space-between; }
        .su-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .su-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .su-recap-list { padding: 8px 20px; overflow: auto; }
        .su-recap-row { display: grid; grid-template-columns: 1fr 70px 90px;
                        align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--line); }
        .su-recap-row:last-child { border-bottom: none; }
        .su-recap-l { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-800); }
        .su-recap-c { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); text-align: right; }
        .su-recap-a { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-800); font-weight: 500; text-align: right; }

        /* Next actions */
        .su-next { padding: 18px 22px; display: flex; flex-direction: column; gap: 10px; }
        .su-next-item { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px; align-items: center;
                        padding: 12px; border-radius: 10px; cursor: pointer;
                        background: var(--cream-100); border: 1px solid var(--line); }
        .su-next-item:hover { border-color: var(--amber-500); }
        .su-next-item.primary { background: var(--amber-100); border-color: rgba(184,105,61,0.3); }
        .su-next-ico { width: 36px; height: 36px; border-radius: 9px; background: var(--cream-50);
                       display: flex; align-items: center; justify-content: center; color: var(--amber-500); }
        .su-next-t { font-size: 13px; color: var(--ink-900); font-weight: 500; }
        .su-next-s { font-size: 11px; color: var(--ink-600); margin-top: 2px; }

        .su-reassure { display: flex; align-items: center; gap: 8px;
                       padding: 10px 14px; background: var(--cream-100); border-radius: 8px;
                       font-size: 11.5px; color: var(--sage-500); margin-top: auto; }
      `}</style>

      <aside className="su-side">
        <div className="su-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"su-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="su-side-foot">
          <div className="su-nav-btn"><IcSun size={18}/></div>
          <div className="su-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="su-main">
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
            <button className="su-btn ghost">↺ Annuler cet import</button>
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
            <div className="su-stat-v" style={{ color: "var(--sage-500)" }}>41 <span style={{ fontSize: 14, color: "var(--ink-500)" }}>/ 47</span></div>
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

        {/* BOTTOM */}
        <div className="su-bot">
          {/* Recap */}
          <div className="su-card">
            <div className="su-card-h">
              <div>
                <div className="su-card-t">Récapitulatif par catégorie</div>
                <div className="su-card-s">comparaison avec mars 2026 entre parenthèses</div>
              </div>
              <button className="su-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Voir le détail <IcArrowR size={11}/></button>
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

          {/* Next actions */}
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
              <div className="su-next-item">
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
    </div>
  );
}

window.ScreenImportSuccess = ScreenImportSuccess;
