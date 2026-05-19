/* Écran — Import de relevés (aperçu après dépôt du fichier)
   Table des transactions extraites + catégories suggérées éditables
   + récap par catégorie + règles. 1440 × 900. */

function ScreenImportPreview() {
  const { CATEGORIES } = window.AMBRE_DATA;
  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, active: true, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  // Extracted transactions (mock — 47 total, we display ~14 visible rows)
  const review = [
    { d: "29/04", lbl: "AMAZON EU SARL",       sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "low",  amt: -34.99 },
    { d: "28/04", lbl: "SALAIRE AVRIL",        sub: "VIR ENT — DUPONT SAS", cat: "inc",  conf: "high", amt: +2560.00 },
    { d: "27/04", lbl: "AUCHAN DRIVE",         sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -82.40 },
    { d: "26/04", lbl: "PRLV STORAGE BOX",     sub: "PRELEVEMENT SEPA",     cat: null,   conf: "none", amt: -12.00 },
    { d: "25/04", lbl: "RETRAIT DAB Lyon Part-Dieu", sub: "RETRAIT ESPECES", cat: null,  conf: "none", amt: -60.00 },
    { d: "24/04", lbl: "SNCF INTERNET",        sub: "PAIEMENT PAR CARTE",   cat: "tra",  conf: "high", amt: -67.00 },
    { d: "23/04", lbl: "BOULANGERIE PICHON",   sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -8.40 },
    { d: "22/04", lbl: "NETFLIX.COM",          sub: "PAIEMENT PAR CARTE",   cat: "abo",  conf: "med",  amt: -13.49 },
    { d: "20/04", lbl: "DR. MARTIN J.",        sub: "VIREMENT SEPA",        cat: "san",  conf: "low",  amt: -55.00 },
    { d: "19/04", lbl: "MONOPRIX RUE DAMPIERRE", sub: "PAIEMENT PAR CARTE", cat: "alim", conf: "high", amt: -42.10 },
    { d: "17/04", lbl: "LOYER AVRIL",          sub: "VIREMENT SEPA",        cat: "loy",  conf: "high", amt: -920.00 },
    { d: "15/04", lbl: "LE PETIT CAFÉ",        sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "high", amt: -14.20 },
    { d: "12/04", lbl: "TOTAL ÉNERGIES",       sub: "PAIEMENT PAR CARTE",   cat: "tra",  conf: "high", amt: -48.10 },
    { d: "10/04", lbl: "FNAC.COM",             sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "med",  amt: -29.90 },
  ];

  // Category recap from the import
  const recap = [
    { id: "loy",  label: "Logement",       color: "#3d2817", count: 1,  sum: 920.00 },
    { id: "alim", label: "Alimentation",   color: "#b8693d", count: 14, sum: 432.60 },
    { id: "tra",  label: "Transports",     color: "#6b7a4f", count: 5,  sum: 167.80 },
    { id: "abo",  label: "Abonnements",    color: "#cd8459", count: 4,  sum: 54.99 },
    { id: "loi",  label: "Loisirs",        color: "#a85a48", count: 8,  sum: 142.30 },
    { id: "san",  label: "Santé",          color: "#9d8b73", count: 2,  sum: 77.50 },
  ];

  const catById = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

  return (
    <div className="ip-root">
      <style>{`
        .ip-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        /* Sidebar */
        .ip-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .ip-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .ip-nav-btn { width: 40px; height: 40px; border-radius: 10px;
                      display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .ip-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .ip-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .ip-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        /* Main */
        .ip-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
        .ip-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ip-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .ip-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ip-bread .crumb-link { color: var(--ink-500); cursor: pointer; }
        .ip-bread .crumb-link:hover { color: var(--amber-500); }
        .ip-h1 { font-family: var(--font-display); font-size: 26px; font-weight: 400; margin: 4px 0 0;
                 color: var(--ink-900); letter-spacing: -0.01em; }
        .ip-h1 .file { font-family: var(--font-mono); font-size: 13px; color: var(--ink-500);
                       margin-left: 10px; font-style: normal; }
        .ip-tool { display: flex; gap: 8px; align-items: center; }
        .ip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }
        .ip-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }
        .ip-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        /* Stats row */
        .ip-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .ip-stat { background: var(--cream-50); border: 1px solid var(--line); border-radius: 12px;
                   padding: 14px 16px; }
        .ip-stat-l { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ip-stat-v { font-family: var(--font-display); font-size: 24px; color: var(--ink-900); line-height: 1.1; margin-top: 6px; }
        .ip-stat-s { font-size: 11px; color: var(--ink-500); margin-top: 4px; font-family: var(--font-mono); }

        /* Two columns */
        .ip-cols { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px; flex: 1; min-height: 0; }
        .ip-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   display: flex; flex-direction: column; min-height: 0; }
        .ip-card-h { padding: 16px 20px 12px; display: flex; align-items: flex-start; justify-content: space-between;
                     border-bottom: 1px solid var(--line); }
        .ip-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        /* Tabs */
        .ip-tabs { display: flex; gap: 4px; }
        .ip-tab { padding: 5px 12px; border-radius: 7px; font-size: 11.5px; color: var(--ink-600);
                  background: transparent; border: 1px solid transparent; display: inline-flex; align-items: center; gap: 6px; }
        .ip-tab.active { background: var(--cream-200); color: var(--ink-800); }
        .ip-tab .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }
        .ip-tab.active .num { color: var(--amber-500); }
        .ip-tab.warn { color: var(--amber-500); }

        /* Table */
        .ip-tbody { overflow: auto; flex: 1; }
        .ip-tr { display: grid; grid-template-columns: 28px 60px 1fr 180px 110px; align-items: center;
                 padding: 10px 20px; border-bottom: 1px dashed var(--line); position: relative; gap: 10px; }
        .ip-tr.review { background: rgba(184,105,61,0.04); }
        .ip-tr.review::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
                                background: var(--amber-500); }
        .ip-tr.head { padding: 8px 20px; background: var(--cream-100); border-bottom: 1px solid var(--line);
                      font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-500); }
        .ip-cb { width: 14px; height: 14px; border: 1.5px solid var(--line-strong); border-radius: 3.5px;
                 cursor: pointer; }
        .ip-cb.checked { background: var(--amber-500); border-color: var(--amber-500); position: relative; }
        .ip-cb.checked::after { content: ""; position: absolute; left: 3px; top: 0px; width: 4px; height: 8px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0; transform: rotate(45deg); }
        .ip-date { font-family: var(--font-mono); font-size: 12px; color: var(--ink-500); }
        .ip-lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-sub { font-size: 10px; color: var(--ink-500); font-family: var(--font-mono); margin-top: 2px;
                  letter-spacing: 0.04em; text-transform: uppercase; }

        /* Editable category chip */
        .ip-cat { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px 4px 10px;
                  border: 1px dashed var(--line-strong); border-radius: 999px; font-size: 11px;
                  cursor: pointer; background: var(--cream-50); }
        .ip-cat.solid { border-style: solid; }
        .ip-cat-none { color: var(--amber-500); border-color: rgba(184,105,61,0.4); background: var(--amber-100); }
        .ip-cat-conf { width: 5px; height: 5px; border-radius: 999px; }
        .conf-high { background: var(--sage-500); }
        .conf-med  { background: var(--amber-500); }
        .conf-low  { background: var(--rose-500); }

        .ip-amt { font-family: var(--font-mono); font-size: 13px; text-align: right; color: var(--ink-800); font-weight: 500; }
        .ip-amt.pos { color: var(--sage-500); }

        /* Recap */
        .ip-recap { display: flex; flex-direction: column; gap: 12px; padding: 16px 20px; flex: 1; min-height: 0; overflow: auto; }
        .ip-recap-row { display: grid; grid-template-columns: 1fr auto auto; align-items: center;
                        gap: 10px; padding: 8px 0; border-bottom: 1px dashed var(--line); }
        .ip-recap-row:last-child { border-bottom: none; }
        .ip-recap-l { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-800); }
        .ip-recap-c { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
        .ip-recap-a { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-800); font-weight: 500; }

        .ip-rule { padding: 14px; border-radius: 10px; background: var(--amber-100);
                   border: 1px solid rgba(184,105,61,0.25); display: flex; gap: 12px; align-items: flex-start; }
        .ip-rule-ico { width: 28px; height: 28px; border-radius: 50%; background: var(--cream-50);
                       display: flex; align-items: center; justify-content: center; color: var(--amber-500); flex-shrink: 0; }
        .ip-rule-t { font-size: 12px; color: var(--ink-900); font-weight: 500; }
        .ip-rule-s { font-size: 11px; color: var(--ink-700); margin-top: 3px; line-height: 1.4; }
        .ip-rule-actions { display: flex; gap: 6px; margin-top: 8px; }

        /* Footer bar */
        .ip-footer { display: flex; align-items: center; justify-content: space-between;
                     padding-top: 4px; border-top: 1px solid var(--line); padding: 14px 0 0; }
        .ip-foot-l { font-size: 12px; color: var(--ink-600); display: flex; align-items: center; gap: 12px; }
        .ip-foot-r { display: flex; gap: 8px; align-items: center; }
      `}</style>

      {/* SIDEBAR */}
      <aside className="ip-side">
        <div className="ip-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"ip-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="ip-side-foot">
          <div className="ip-nav-btn"><IcSun size={18}/></div>
          <div className="ip-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="ip-main">
        <div className="ip-top">
          <div>
            <div className="ip-bread">
              <span className="crumb-link">Importer</span>
              <IcArrowR size={10}/>
              <strong>Aperçu</strong>
            </div>
            <h1 className="ip-h1">
              Relevé BNP Paribas — avril 2026
              <span className="file">releve-bnp-avril-2026.pdf · 318 ko</span>
            </h1>
          </div>
          <div className="ip-tool">
            <button className="ip-btn ghost">Annuler</button>
            <button className="ip-btn"><IcSearch size={14}/>Aperçu du PDF</button>
            <button className="ip-btn amber"><IcArrowR size={14}/>Importer 47 transactions</button>
          </div>
        </div>

        {/* STATS */}
        <div className="ip-stats">
          <div className="ip-stat">
            <div className="ip-stat-l">Transactions détectées</div>
            <div className="ip-stat-v">47</div>
            <div className="ip-stat-s">dont 6 à vérifier · 2 sans catégorie</div>
          </div>
          <div className="ip-stat">
            <div className="ip-stat-l">Période</div>
            <div className="ip-stat-v">01 – 30 avr.</div>
            <div className="ip-stat-s">30 jours · sans doublon avec mars</div>
          </div>
          <div className="ip-stat">
            <div className="ip-stat-l">Total débits</div>
            <div className="ip-stat-v" style={{ color: "var(--rose-500)" }}>−1 695,00 €</div>
            <div className="ip-stat-s">42 mouvements</div>
          </div>
          <div className="ip-stat">
            <div className="ip-stat-l">Total crédits</div>
            <div className="ip-stat-v" style={{ color: "var(--sage-500)" }}>+2 560,00 €</div>
            <div className="ip-stat-s">5 mouvements</div>
          </div>
        </div>

        {/* TWO COLUMNS */}
        <div className="ip-cols">
          {/* TABLE */}
          <div className="ip-card">
            <div className="ip-card-h">
              <div>
                <div className="ip-card-t">Transactions extraites</div>
                <div className="ip-card-s">cliquez sur une catégorie pour la modifier</div>
              </div>
              <div className="ip-tabs">
                <button className="ip-tab active">Tout <span className="num">47</span></button>
                <button className="ip-tab warn">À vérifier <span className="num">6</span></button>
                <button className="ip-tab">Sans catégorie <span className="num">2</span></button>
              </div>
            </div>
            <div className="ip-tr head">
              <span/>
              <span>Date</span>
              <span>Libellé</span>
              <span>Catégorie suggérée</span>
              <span style={{ textAlign: "right" }}>Montant</span>
            </div>
            <div className="ip-tbody">
              {review.map((t, i) => {
                const cat = t.cat ? catById[t.cat] : null;
                const isReview = t.conf === "low" || t.conf === "none";
                return (
                  <div key={i} className={"ip-tr" + (isReview ? " review" : "")}>
                    <span className={"ip-cb" + (i % 5 === 0 ? " checked" : "")}/>
                    <span className="ip-date">{t.d}</span>
                    <div>
                      <div className="ip-lbl">{t.lbl}</div>
                      <div className="ip-sub">{t.sub}</div>
                    </div>
                    <div>
                      {t.cat === "inc" ? (
                        <span className="ip-cat solid" style={{ borderColor: "rgba(107,122,79,0.4)", color: "var(--sage-500)" }}>
                          <span className="ip-cat-conf conf-high"/>Revenus<IcChevDn size={10}/>
                        </span>
                      ) : cat ? (
                        <span className="ip-cat solid" style={{ borderColor: cat.color + "55", color: cat.color }}>
                          <span className={"ip-cat-conf conf-" + t.conf}/>
                          {cat.label}<IcChevDn size={10}/>
                        </span>
                      ) : (
                        <span className="ip-cat ip-cat-none">
                          <IcPlus size={10}/>Choisir<IcChevDn size={10}/>
                        </span>
                      )}
                    </div>
                    <span className={"ip-amt" + (t.amt > 0 ? " pos" : "")}>
                      {t.amt > 0 ? "+" : ""}{fmtEUR(t.amt, 2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RECAP + RULES */}
          <div className="ip-card">
            <div className="ip-card-h">
              <div>
                <div className="ip-card-t">Récapitulatif</div>
                <div className="ip-card-s">par catégorie suggérée</div>
              </div>
              <span className="amb-chip" style={{ color: "var(--sage-500)", borderColor: "rgba(107,122,79,0.35)", background: "rgba(107,122,79,0.08)" }}>
                <IcDot size={10}/>87 % de confiance
              </span>
            </div>
            <div className="ip-recap">
              {recap.map(r => (
                <div key={r.id} className="ip-recap-row">
                  <span className="ip-recap-l">
                    <span className="amb-dot" style={{ background: r.color }}/>
                    {r.label}
                  </span>
                  <span className="ip-recap-c">{r.count} tx</span>
                  <span className="ip-recap-a">{fmtEUR(r.sum, 0)}</span>
                </div>
              ))}
              <div className="ip-recap-row">
                <span className="ip-recap-l" style={{ color: "var(--amber-500)" }}>
                  <span className="amb-dot" style={{ background: "var(--amber-500)" }}/>
                  Sans catégorie
                </span>
                <span className="ip-recap-c">2 tx</span>
                <span className="ip-recap-a">{fmtEUR(72, 0)}</span>
              </div>

              {/* Smart rule suggestion */}
              <div className="ip-rule">
                <div className="ip-rule-ico">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                       strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
                  </svg>
                </div>
                <div>
                  <div className="ip-rule-t">Créer une règle pour Netflix.com ?</div>
                  <div className="ip-rule-s">
                    Toutes les transactions contenant « NETFLIX » seront classées en
                    <strong style={{ color: "var(--ink-900)" }}> Abonnements</strong> à l'avenir.
                  </div>
                  <div className="ip-rule-actions">
                    <button className="ip-btn" style={{ padding: "5px 12px", fontSize: 11, background: "var(--cream-50)" }}>Plus tard</button>
                    <button className="ip-btn amber" style={{ padding: "5px 12px", fontSize: 11 }}>Créer la règle</button>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)",
                          display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--sage-500)" }}>
              <IcLock size={11}/>
              Aucune donnée n'a quitté votre appareil.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ScreenImportPreview = ScreenImportPreview;
