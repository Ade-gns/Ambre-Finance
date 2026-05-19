/* Écran — Dashboard état vide (premier lancement, aucun relevé)
   1440 × 900. Même structure que le Dashboard normal mais en "fantôme" + CTA central. */

function ScreenDashboardEmpty() {
  const { CATEGORIES } = window.AMBRE_DATA;
  const navItems = [
    { icon: IcHome, active: true, label: "Tableau" },
    { icon: IcImport, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes" },
    { icon: IcSettings, label: "Paramètres" },
  ];

  return (
    <div className="de-root">
      <style>{`
        .de-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        .de-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .de-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .de-nav-btn { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .de-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .de-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .de-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
        .de-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .de-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .de-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .de-h1 { font-family: var(--font-display); font-size: 26px; font-weight: 400; margin: 4px 0 0;
                 color: var(--ink-900); letter-spacing: -0.01em; }
        .de-h1 em { font-style: italic; color: var(--amber-500); }
        .de-tool { display: flex; gap: 8px; }
        .de-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }
        .de-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }

        /* Hero invite */
        .de-hero { background: var(--cream-50); border: 1.5px dashed rgba(184,105,61,0.4);
                   border-radius: 16px; padding: 36px 40px; display: grid;
                   grid-template-columns: 1fr 280px; gap: 32px; align-items: center;
                   position: relative; overflow: hidden; }
        .de-hero::before { content: ""; position: absolute; inset: 0;
                           background-image: repeating-linear-gradient(45deg, transparent 0 14px, rgba(184,105,61,0.03) 14px 16px);
                           pointer-events: none; }
        .de-hero > * { position: relative; z-index: 1; }
        .de-hero-l { font-size: 11px; color: var(--amber-500); letter-spacing: 0.1em; text-transform: uppercase;
                     display: flex; align-items: center; gap: 8px; }
        .de-hero-l .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--amber-500); }
        .de-hero-h { font-family: var(--font-display); font-size: 36px; line-height: 1.1; color: var(--ink-900);
                     letter-spacing: -0.01em; margin: 10px 0 6px; max-width: 600px; }
        .de-hero-h em { font-style: italic; color: var(--amber-500); }
        .de-hero-s { font-size: 13px; color: var(--ink-600); line-height: 1.55; max-width: 580px; }
        .de-hero-actions { display: flex; gap: 10px; align-items: center; margin-top: 16px; }
        .de-hero-cta { display: inline-flex; align-items: center; gap: 8px;
                       padding: 10px 18px; background: var(--amber-500); color: var(--cream-50);
                       border: none; border-radius: 9px; font-size: 13px; font-weight: 500; }
        .de-hero-alt { font-size: 12px; color: var(--ink-600); }
        .de-hero-alt a { color: var(--amber-500); cursor: pointer; }

        /* Illustration: stacked envelopes / paper */
        .de-illu { position: relative; height: 180px; }
        .de-paper { position: absolute; background: var(--cream-50); border: 1px solid var(--line);
                    border-radius: 8px; box-shadow: 0 6px 12px rgba(61,40,23,0.06); }
        .de-paper-1 { width: 180px; height: 160px; left: 50px; top: 10px; transform: rotate(-6deg);
                      background: var(--cream-200); }
        .de-paper-2 { width: 180px; height: 160px; left: 80px; top: 18px; transform: rotate(2deg); }
        .de-paper-3 { width: 180px; height: 160px; left: 60px; top: 0;   transform: rotate(-1deg);
                      background: var(--cream-50); display: flex; flex-direction: column; padding: 14px; gap: 8px; }
        .de-paper-3 .line { height: 5px; background: rgba(61,40,23,0.07); border-radius: 999px; }
        .de-paper-3 .line.amber { background: rgba(184,105,61,0.25); width: 60%; }
        .de-paper-3 .line.sage { background: rgba(107,122,79,0.25); width: 75%; }

        /* Ghost cards */
        .de-ghosts { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .de-ghost { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                    padding: 16px 18px; opacity: 0.65; }
        .de-ghost-l { font-size: 11px; color: var(--ink-500); letter-spacing: 0.08em; text-transform: uppercase; }
        .de-ghost-v { font-family: var(--font-display); font-size: 32px; color: var(--ink-400); margin-top: 6px; }
        .de-ghost-s { font-size: 11px; color: var(--ink-500); margin-top: 6px; font-family: var(--font-mono); }

        .de-body { display: grid; grid-template-columns: 1fr 1.3fr; gap: 12px; flex: 1; min-height: 0; }
        .de-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; opacity: 0.7; }
        .de-card-h { display: flex; justify-content: space-between; align-items: flex-start; }
        .de-card-t { font-size: 13px; color: var(--ink-700); font-weight: 500; }
        .de-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .de-empty-center { display: flex; flex-direction: column; align-items: center; justify-content: center;
                           flex: 1; gap: 8px; color: var(--ink-500); text-align: center; padding: 16px; }
        .de-empty-ico { width: 40px; height: 40px; border-radius: 10px; background: var(--cream-200);
                        color: var(--ink-500); display: flex; align-items: center; justify-content: center; margin-bottom: 4px; }
        .de-empty-t { font-size: 13px; color: var(--ink-700); }
        .de-empty-s { font-size: 11px; color: var(--ink-500); max-width: 260px; line-height: 1.5; }

        .de-cats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
        .de-cat-ghost { padding: 12px; border-radius: 10px; background: var(--cream-100);
                        border: 1px dashed var(--line); display: flex; flex-direction: column; gap: 8px; opacity: 0.6; }
        .de-cat-h { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--ink-500); }
        .de-cat-v { font-family: var(--font-display); font-size: 17px; color: var(--ink-400); }
      `}</style>

      <aside className="de-side">
        <div className="de-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"de-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
            </div>
          );
        })}
        <div className="de-side-foot">
          <div className="de-nav-btn"><IcSun size={18}/></div>
          <div className="de-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="de-main">
        <div className="de-top">
          <div>
            <div className="de-bread">Ambre · <strong>Tableau de bord</strong></div>
            <h1 className="de-h1">Bienvenue, <em>Camille</em>.</h1>
          </div>
          <div className="de-tool">
            <button className="de-btn"><IcCalendar size={14}/>Mai 2026 <IcChevDn size={12}/></button>
            <button className="de-btn amber"><IcUpload size={14}/>Importer un relevé</button>
          </div>
        </div>

        {/* HERO */}
        <div className="de-hero">
          <div>
            <div className="de-hero-l"><span className="dot"/>Premier lancement</div>
            <h2 className="de-hero-h">
              Aucun relevé pour le moment.<br/>
              <em>Commençons par un import.</em>
            </h2>
            <p className="de-hero-s">
              Glissez un PDF de votre banque ou un export CSV — Ambre détectera le format,
              extraira les transactions et les pré-classera. Vous validez ensuite ce que vous voulez garder.
            </p>
            <div className="de-hero-actions">
              <button className="de-hero-cta"><IcUpload size={14}/>Importer mon premier relevé</button>
              <span className="de-hero-alt">ou <a>charger un jeu de données d'exemple</a></span>
            </div>
          </div>
          <div className="de-illu">
            <div className="de-paper de-paper-1"/>
            <div className="de-paper de-paper-2"/>
            <div className="de-paper de-paper-3">
              <div className="line" style={{ width: "45%" }}/>
              <div className="line amber"/>
              <div className="line" style={{ width: "70%" }}/>
              <div className="line sage"/>
              <div className="line" style={{ width: "50%" }}/>
              <div className="line" style={{ width: "65%" }}/>
            </div>
          </div>
        </div>

        {/* Ghost KPIs */}
        <div className="de-ghosts">
          <div className="de-ghost">
            <div className="de-ghost-l">Dépensé ce mois</div>
            <div className="de-ghost-v">— €</div>
            <div className="de-ghost-s">en attente d'import</div>
          </div>
          <div className="de-ghost">
            <div className="de-ghost-l">Revenus</div>
            <div className="de-ghost-v">— €</div>
            <div className="de-ghost-s">—</div>
          </div>
          <div className="de-ghost">
            <div className="de-ghost-l">Solde net</div>
            <div className="de-ghost-v">— €</div>
            <div className="de-ghost-s">—</div>
          </div>
          <div className="de-ghost">
            <div className="de-ghost-l">Transactions</div>
            <div className="de-ghost-v">0</div>
            <div className="de-ghost-s">aucune pour le moment</div>
          </div>
        </div>

        <div className="de-body">
          <div className="de-card">
            <div className="de-card-h">
              <div>
                <div className="de-card-t">Calendrier des dépenses</div>
                <div className="de-card-s">il vivra ici, jour par jour</div>
              </div>
            </div>
            <div className="de-empty-center">
              <div className="de-empty-ico"><IcCalendar size={18}/></div>
              <div className="de-empty-t">Un mois encore vide.</div>
              <div className="de-empty-s">Chaque jour s'allumera au fur et à mesure que vous importez vos relevés.</div>
            </div>
          </div>

          <div className="de-card">
            <div className="de-card-h">
              <div>
                <div className="de-card-t">Catégories</div>
                <div className="de-card-s">6 par défaut · entièrement personnalisables</div>
              </div>
              <button className="de-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Personnaliser <IcArrowR size={11}/></button>
            </div>
            <div className="de-cats-grid">
              {CATEGORIES.map(c => (
                <div key={c.id} className="de-cat-ghost">
                  <div className="de-cat-h">
                    <span className="amb-dot" style={{ background: c.color }}/>
                    {c.label}
                  </div>
                  <div className="de-cat-v">— €</div>
                  <div style={{ height: 24, background: "rgba(61,40,23,0.04)", borderRadius: 4 }}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ScreenDashboardEmpty = ScreenDashboardEmpty;
