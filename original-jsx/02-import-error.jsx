/* Écran — Import en erreur
   1440 × 900. Une page principale présentant l'erreur courante,
   et la liste des 3 cas d'erreur fréquents en dessous. */

function ScreenImportError() {
  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, active: true, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  const otherCases = [
    {
      kind: "duplicate",
      title: "12 transactions déjà importées",
      sub: "releve-bnp-avril-2026.pdf",
      desc: "Vous avez importé un relevé qui chevauche partiellement mars 2026. Les doublons ont été détectés grâce à leur date + montant + libellé.",
      tone: "warn"
    },
    {
      kind: "corrupted",
      title: "Fichier corrompu ou protégé",
      sub: "relevé-2026-protégé.pdf",
      desc: "Le PDF est verrouillé par mot de passe ou les pages ne peuvent pas être lues. Décochez la protection dans votre navigateur de PDF puis réessayez.",
      tone: "danger"
    }
  ];

  return (
    <div className="ier-root">
      <style>{`
        .ier-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                    display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }
        .ier-side { background: var(--cream-50); border-right: 1px solid var(--line);
                    display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .ier-logo { width: 38px; height: 38px; border-radius: 10px;
                    background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                    display: flex; align-items: center; justify-content: center;
                    font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .ier-nav-btn { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                       color: var(--ink-500); position: relative; }
        .ier-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .ier-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                            border-radius: 999px; background: var(--rose-500); }
        .ier-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .ier-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 18px; overflow: hidden; }
        .ier-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; display: flex; gap: 6px; align-items: center; }
        .ier-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ier-bread .err { color: var(--rose-500); font-weight: 500; letter-spacing: 0; text-transform: none; }

        /* HERO — erreur courante */
        .ier-hero { background: var(--cream-50); border: 1px solid rgba(168,90,72,0.3); border-radius: 16px;
                    padding: 36px 44px; display: grid; grid-template-columns: 100px 1fr 280px; gap: 32px; align-items: center;
                    position: relative; overflow: hidden; }
        .ier-hero::before { content: ""; position: absolute; inset: 0; opacity: 0.5;
                            background-image: radial-gradient(circle at 90% 30%, rgba(168,90,72,0.08), transparent 60%); }
        .ier-hero > * { position: relative; z-index: 1; }
        .ier-mark { width: 80px; height: 80px; border-radius: 50%;
                    background: linear-gradient(135deg, #d68a76, #a85a48); color: var(--cream-50);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 20px rgba(168,90,72,0.22); }
        .ier-l { font-size: 11px; color: var(--rose-500); letter-spacing: 0.1em; text-transform: uppercase;
                 display: flex; align-items: center; gap: 8px; }
        .ier-l .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--rose-500); }
        .ier-h { font-family: var(--font-display); font-size: 36px; line-height: 1.05; color: var(--ink-900);
                 letter-spacing: -0.02em; margin: 8px 0 6px; font-weight: 400; max-width: 600px; }
        .ier-h em { font-style: italic; color: var(--rose-500); }
        .ier-s { font-size: 13.5px; color: var(--ink-700); line-height: 1.5; max-width: 580px; }
        .ier-meta { display: flex; gap: 14px; margin-top: 14px; font-size: 11px; color: var(--ink-500);
                    font-family: var(--font-mono); }
        .ier-meta strong { color: var(--ink-800); font-weight: 500; }
        .ier-actions { display: flex; flex-direction: column; gap: 8px; align-items: stretch; }
        .ier-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
                   border: 1px solid var(--line); border-radius: 9px; background: var(--cream-50);
                   color: var(--ink-700); font-size: 13px; justify-content: center; }
        .ier-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }
        .ier-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); font-size: 12px; }

        /* Detail card */
        .ier-detail { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                      padding: 18px 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .ier-detail-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 10px; }
        .ier-detail-t { font-size: 13px; color: var(--ink-800); font-weight: 500; margin-bottom: 4px; }
        .ier-detail-s { font-size: 12.5px; color: var(--ink-600); line-height: 1.5; }
        .ier-detail-list { display: flex; flex-direction: column; gap: 8px; }
        .ier-detail-item { display: flex; gap: 10px; align-items: flex-start; font-size: 12.5px; color: var(--ink-700); }
        .ier-detail-item .num { width: 22px; height: 22px; border-radius: 6px; background: var(--cream-200);
                                color: var(--ink-700); display: flex; align-items: center; justify-content: center;
                                font-family: var(--font-mono); font-size: 11px; font-weight: 500; flex-shrink: 0; }

        .ier-code { font-family: var(--font-mono); font-size: 12px; color: var(--ink-700);
                    background: var(--cream-100); border-left: 3px solid var(--rose-500); padding: 12px 16px;
                    border-radius: 0 8px 8px 0; margin-top: 4px; }
        .ier-code .num { color: var(--ink-500); margin-right: 12px; }
        .ier-code .err { color: var(--rose-500); }

        /* Other errors list */
        .ier-others { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                      padding: 0; flex: 1; min-height: 0; overflow: hidden; display: flex; flex-direction: column; }
        .ier-others-h { padding: 16px 22px 12px; border-bottom: 1px solid var(--line);
                        display: flex; justify-content: space-between; align-items: flex-start; }
        .ier-other-row { display: grid; grid-template-columns: 44px 1fr 140px; gap: 16px;
                         align-items: center; padding: 14px 22px; border-bottom: 1px dashed var(--line); }
        .ier-other-row:last-child { border-bottom: none; }
        .ier-other-ico { width: 44px; height: 44px; border-radius: 11px; display: flex; align-items: center; justify-content: center; }
        .ier-other-ico.warn { background: var(--amber-100); color: var(--amber-500); }
        .ier-other-ico.danger { background: rgba(168,90,72,0.10); color: var(--rose-500); }
        .ier-other-t { font-size: 13.5px; color: var(--ink-900); font-weight: 500; }
        .ier-other-sub { font-size: 11px; color: var(--ink-500); margin-top: 2px; font-family: var(--font-mono); }
        .ier-other-d { font-size: 12px; color: var(--ink-600); margin-top: 4px; line-height: 1.4; }
        .ier-other-cta { display: flex; flex-direction: column; gap: 6px; }
      `}</style>

      <aside className="ier-side">
        <div className="ier-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"ier-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="ier-side-foot">
          <div className="ier-nav-btn"><IcSun size={18}/></div>
          <div className="ier-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="ier-main">
        <div className="ier-bread">
          <span>Importer</span>
          <IcArrowR size={10}/>
          <span className="err">Erreur de lecture</span>
        </div>

        {/* HERO — format non reconnu */}
        <div className="ier-hero">
          <div className="ier-mark">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4"/><path d="M12 17h.01"/>
              <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/>
            </svg>
          </div>
          <div>
            <div className="ier-l"><span className="dot"/>Format non reconnu</div>
            <h2 className="ier-h">Impossible de lire ce <em>relevé</em>.</h2>
            <p className="ier-s">
              Ambre n'a pas reconnu la structure du fichier — ni le format BNP, ni un CSV standard. Le PDF est
              peut-être un export filtré, scanné, ou suit un format propriétaire que nous n'avons pas encore couvert.
            </p>
            <div className="ier-meta">
              <span>Fichier · <strong>autre-export-2024-Q4.pdf</strong></span>
              <span>Taille · <strong>1,2 Mo · 6 pages</strong></span>
              <span>Type détecté · <strong>application/pdf</strong></span>
            </div>
          </div>
          <div className="ier-actions">
            <button className="ier-btn amber"><IcImport size={14}/>Essayer un autre fichier</button>
            <button className="ier-btn"><IcTag size={14}/>Configurer un parseur custom</button>
            <button className="ier-btn ghost">↻ Réessayer la lecture</button>
            <button className="ier-btn ghost">🛟 Voir l'aide d'import</button>
          </div>
        </div>

        {/* Detail */}
        <div className="ier-detail">
          <div>
            <div className="ier-detail-h">Ce qu'a essayé Ambre</div>
            <div className="ier-detail-list">
              {[
                { n: "1", t: "Détection du format", s: "PDF valide · 6 pages · non chiffré ✓" },
                { n: "2", t: "Recherche d'un parseur connu", s: "Aucun parseur correspondant (BNP, LBP, CA, BoursoBank, Revolut)" },
                { n: "3", t: "Extraction tabulaire générique", s: "Tableaux détectés mais colonnes ambiguës — pas de date claire" },
                { n: "4", t: "Fallback texte simple", s: "Échoué · le contenu est mis en page sur 2 colonnes" },
              ].map(s => (
                <div key={s.n} className="ier-detail-item">
                  <span className="num">{s.n}</span>
                  <div>
                    <div style={{ color: "var(--ink-900)", fontWeight: 500 }}>{s.t}</div>
                    <div style={{ color: "var(--ink-500)", marginTop: 2 }}>{s.s}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="ier-detail-h">Journal technique</div>
            <div className="ier-detail-s">
              Si vous écrivez un parseur custom, voici les premières lignes interprétées du fichier.
              Vous pouvez consulter le log complet dans <strong>Paramètres → Sauvegarde</strong>.
            </div>
            <div className="ier-code">
              <div><span className="num">01</span>scanning PDF · 6 pages · 1.2MB</div>
              <div><span className="num">02</span>fonts: Helvetica, Helvetica-Bold</div>
              <div><span className="num">03</span>tables: 12 candidates, 2-column layout detected</div>
              <div><span className="num">04</span>match-bnp:  <span className="err">no match (logo missing)</span></div>
              <div><span className="num">05</span>match-csv:  <span className="err">not a csv</span></div>
              <div><span className="num">06</span>match-ofx:  <span className="err">no OFX header</span></div>
              <div><span className="num">07</span>generic-table: ambiguous column types</div>
              <div><span className="num">08</span><span className="err">→ ERR_FORMAT_UNKNOWN</span>  abandoning</div>
            </div>
          </div>
        </div>

        {/* Other error cases */}
        <div className="ier-others">
          <div className="ier-others-h">
            <div>
              <div style={{ fontSize: 13, color: "var(--ink-800)", fontWeight: 500 }}>Autres erreurs récentes</div>
              <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>2 fichiers · cliquer pour voir le détail</div>
            </div>
            <button className="ier-btn ghost" style={{ padding: "4px 10px" }}>Effacer le journal</button>
          </div>
          {otherCases.map(c => (
            <div key={c.kind} className="ier-other-row">
              <div className={"ier-other-ico " + c.tone}>
                {c.kind === "duplicate"
                  ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="14" height="14" rx="2"/><rect x="9" y="9" width="11" height="11" rx="2"/></svg>
                  : <IcLock size={20}/>}
              </div>
              <div>
                <div className="ier-other-t">{c.title}</div>
                <div className="ier-other-sub">{c.sub}</div>
                <div className="ier-other-d">{c.desc}</div>
              </div>
              <div className="ier-other-cta">
                <button className="ier-btn" style={{ padding: "6px 10px", fontSize: 11.5 }}>
                  {c.kind === "duplicate" ? "Importer uniquement les nouvelles" : "Ouvrir le fichier"}
                </button>
                <button className="ier-btn ghost" style={{ padding: "4px 10px", fontSize: 11 }}>
                  Tout annuler
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

window.ScreenImportError = ScreenImportError;
