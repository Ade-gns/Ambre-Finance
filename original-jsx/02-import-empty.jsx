/* Écran — Import de relevés (état vide)
   Drop zone + historique d'imports + sources reconnues.
   1440 × 900, palette claire ambre. */

function ScreenImportEmpty() {
  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, active: true, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  const sources = [
    { name: "BNP Paribas",       fmt: "PDF, CSV", last: "Avril 2026", status: "ok" },
    { name: "La Banque Postale", fmt: "PDF, CSV", last: "Mars 2026",  status: "ok" },
    { name: "Crédit Agricole",   fmt: "PDF, OFX", last: "Jamais",     status: "new" },
    { name: "Boursorama",        fmt: "CSV, OFX", last: "Jamais",     status: "new" },
    { name: "Revolut",           fmt: "CSV",      last: "Jamais",     status: "new" },
    { name: "Autre — CSV générique", fmt: "CSV",  last: null,         status: "generic" },
  ];

  const history = [
    { file: "releve-bnp-avril-2026.pdf", date: "12 mai · 10h32", tx: 47, period: "01 – 30 avril",     size: "318 ko" },
    { file: "lbp-mars-2026.csv",         date: "08 avril · 19h12", tx: 42, period: "01 – 31 mars",   size: "12 ko" },
    { file: "releve-bnp-mars-2026.pdf",  date: "06 avril · 22h04", tx: 39, period: "01 – 31 mars",   size: "291 ko" },
    { file: "lbp-fevrier-2026.csv",      date: "08 mars · 18h44",  tx: 36, period: "01 – 28 février", size: "11 ko" },
  ];

  return (
    <div className="ie-root">
      <style>{`
        .ie-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        /* Sidebar */
        .ie-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .ie-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .ie-nav-btn { width: 40px; height: 40px; border-radius: 10px;
                      display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .ie-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .ie-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .ie-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        /* Main */
        .ie-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 16px; overflow: hidden; }
        .ie-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ie-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ie-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ie-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
                 color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-h1 em { font-style: italic; color: var(--amber-500); }
        .ie-tool { display: flex; gap: 8px; align-items: center; }
        .ie-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }
        .ie-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }

        /* Drop zone */
        .ie-drop { background: var(--cream-50);
                   border: 1.5px dashed rgba(184,105,61,0.45); border-radius: 14px;
                   padding: 40px 28px; display: flex; flex-direction: column; align-items: center; gap: 14px;
                   position: relative; overflow: hidden; }
        .ie-drop::before {
          content: ""; position: absolute; inset: 0; background-image:
            repeating-linear-gradient(45deg, transparent 0 14px, rgba(184,105,61,0.025) 14px 16px);
          pointer-events: none;
        }
        .ie-drop > * { position: relative; z-index: 1; }
        .ie-drop-ico { width: 60px; height: 60px; border-radius: 16px;
                       background: var(--amber-100); color: var(--amber-500);
                       display: flex; align-items: center; justify-content: center; }
        .ie-drop-t { font-family: var(--font-display); font-size: 26px; color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-drop-s { font-size: 13px; color: var(--ink-600); text-align: center; max-width: 480px; }
        .ie-drop-actions { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
        .ie-drop-formats { display: flex; gap: 8px; margin-top: 6px; }
        .ie-fmt-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                       border-radius: 999px; background: var(--cream-200); font-size: 11px; color: var(--ink-700);
                       font-family: var(--font-mono); }
        .ie-trust { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--sage-500);
                    padding-top: 6px; border-top: 1px dashed var(--line); }

        /* Two-column row below */
        .ie-cols { display: grid; grid-template-columns: 1fr 1.05fr; gap: 14px; flex: 1; min-height: 0; }
        .ie-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   padding: 18px 20px; display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        .ie-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
        .ie-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ie-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        /* Sources */
        .ie-src-list { display: flex; flex-direction: column; }
        .ie-src-row { display: grid; grid-template-columns: 28px 1fr auto auto; align-items: center;
                      gap: 10px; padding: 10px 0; border-bottom: 1px dashed var(--line); }
        .ie-src-row:last-child { border-bottom: none; }
        .ie-src-mark { width: 28px; height: 28px; border-radius: 7px;
                       background: var(--cream-200); display: flex; align-items: center; justify-content: center;
                       font-family: var(--font-display); font-style: italic; font-size: 15px; color: var(--ink-700); }
        .ie-src-name { font-size: 13px; color: var(--ink-800); }
        .ie-src-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px; font-family: var(--font-mono); }
        .ie-src-last { font-size: 11px; color: var(--ink-500); }
        .ie-src-status { font-size: 10px; padding: 2px 8px; border-radius: 999px;
                         border: 1px solid var(--line); color: var(--ink-600); }
        .ie-src-status.ok { background: rgba(107,122,79,0.10); border-color: rgba(107,122,79,0.35); color: var(--sage-500); }
        .ie-src-status.new { background: var(--amber-100); border-color: rgba(184,105,61,0.35); color: var(--amber-500); }

        /* History */
        .ie-hist-row { display: grid; grid-template-columns: 32px 1fr auto auto; gap: 12px;
                       align-items: center; padding: 12px 0; border-bottom: 1px dashed var(--line); }
        .ie-hist-row:last-child { border-bottom: none; }
        .ie-hist-ico { width: 32px; height: 32px; border-radius: 8px; background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center; color: var(--ink-600); }
        .ie-hist-file { font-size: 12.5px; color: var(--ink-800); font-family: var(--font-mono); }
        .ie-hist-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
        .ie-hist-tx { display: inline-flex; align-items: center; gap: 4px;
                      padding: 3px 8px; border-radius: 999px; background: var(--amber-100); color: var(--amber-500);
                      font-size: 11px; font-weight: 500; }
        .ie-hist-act { display: flex; gap: 6px; }
        .ie-hist-act > button { width: 26px; height: 26px; padding: 0; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="ie-side">
        <div className="ie-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"ie-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="ie-side-foot">
          <div className="ie-nav-btn"><IcSun size={18}/></div>
          <div className="ie-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ie-main">
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
            <button className="ie-btn amber" style={{ padding: "9px 16px", fontSize: 13 }}>
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
                <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11, background: "var(--amber-100)", color: "var(--amber-500)", borderColor: "rgba(184,105,61,0.3)" }}>Tous</button>
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
    </div>
  );
}

window.ScreenImportEmpty = ScreenImportEmpty;
