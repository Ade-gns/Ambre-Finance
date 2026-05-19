/* Écran — Gestion des catégories
   1440 × 900. Liste à gauche + édition + règles à droite. */

function ScreenCategoriesManage() {
  const { CATEGORIES } = window.AMBRE_DATA;
  const allCats = [
    ...CATEGORIES.map(c => ({ ...c })),
    { id: "epa",  label: "Épargne",      color: "#9d8b73", amount: 300.00, share: 0.10 },
    { id: "fou",  label: "Restaurants",  color: "#a85a48", amount: 68.50,  share: 0.04 },
    { id: "edu",  label: "Éducation",    color: "#7a5c3a", amount: 0,      share: 0 },
  ];
  const selected = allCats.find(c => c.id === "alim");

  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, active: true, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, label: "Paramètres" },
  ];

  const rules = [
    { id: 1, when: "libellé contient", op: "carrefour", to: "alim", auto: 14, last: "14/05" },
    { id: 2, when: "libellé contient", op: "monoprix", to: "alim", auto: 8,  last: "07/05" },
    { id: 3, when: "libellé contient", op: "boulangerie OU patisserie", to: "alim", auto: 12, last: "10/05" },
    { id: 4, when: "marchand =",       op: "Auchan Drive",       to: "alim", auto: 6,  last: "05/05" },
    { id: 5, when: "libellé contient", op: "fnac.com",            to: "loi",  auto: 3,  last: "11/05" },
  ];

  const colorOptions = ["#b8693d","#cd8459","#a85a48","#3d2817","#6b7a4f","#7a5c3a","#9d8b73","#d4a76a"];

  return (
    <div className="cm-root">
      <style>{`
        .cm-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        .cm-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .cm-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .cm-nav-btn { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .cm-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .cm-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .cm-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .cm-main { padding: 22px 28px; display: flex; flex-direction: column; gap: 14px; overflow: hidden; }
        .cm-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .cm-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .cm-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .cm-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
                 color: var(--ink-900); letter-spacing: -0.01em; }
        .cm-h1 em { font-style: italic; color: var(--amber-500); }
        .cm-tool { display: flex; gap: 8px; align-items: center; }
        .cm-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }
        .cm-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }

        .cm-body { display: grid; grid-template-columns: 1fr 1.7fr; gap: 14px; flex: 1; min-height: 0; }
        .cm-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
        .cm-card-h { padding: 16px 18px 12px; border-bottom: 1px solid var(--line);
                     display: flex; align-items: flex-start; justify-content: space-between; }
        .cm-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .cm-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        /* LEFT — list */
        .cm-search { display: flex; align-items: center; gap: 8px; background: var(--cream-100);
                     border: 1px solid var(--line); border-radius: 8px; padding: 7px 10px; margin: 10px 18px; }
        .cm-search input { border: none; outline: none; background: transparent; flex: 1; font-size: 12px; }
        .cm-list { overflow: auto; flex: 1; }
        .cm-list-row { display: grid; grid-template-columns: 14px 24px 1fr 60px 24px; gap: 10px;
                       align-items: center; padding: 9px 18px; border-bottom: 1px dashed var(--line);
                       cursor: pointer; }
        .cm-list-row:hover { background: var(--cream-100); }
        .cm-list-row.active { background: var(--amber-100); }
        .cm-list-row.active::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0; width: 2px;
                                       background: var(--amber-500); }
        .cm-list-row { position: relative; }
        .cm-drag { color: var(--ink-500); cursor: grab; }
        .cm-list-mark { width: 24px; height: 24px; border-radius: 6px; color: var(--cream-50);
                        display: flex; align-items: center; justify-content: center;
                        font-family: var(--font-display); font-style: italic; font-size: 13px; }
        .cm-list-name { font-size: 13px; color: var(--ink-800); }
        .cm-list-meta { font-size: 11px; color: var(--ink-500); margin-top: 1px; font-family: var(--font-mono); }
        .cm-list-amt { font-family: var(--font-mono); font-size: 12px; color: var(--ink-700); text-align: right; }

        /* RIGHT — editor */
        .cm-editor { padding: 18px 22px; display: flex; flex-direction: column; gap: 16px; overflow: auto; }
        .cm-section-h { font-size: 10px; color: var(--ink-500); letter-spacing: 0.1em;
                        text-transform: uppercase; margin-bottom: 8px; }
        .cm-row { display: grid; grid-template-columns: 130px 1fr; gap: 18px; align-items: center; }
        .cm-row-stack { display: flex; flex-direction: column; align-items: stretch; gap: 8px; }
        .cm-input { background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px;
                    padding: 8px 12px; font-size: 13px; color: var(--ink-800); font-family: inherit; outline: none; }
        .cm-input:focus { border-color: var(--amber-500); }

        .cm-color-picker { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
        .cm-color { width: 26px; height: 26px; border-radius: 7px; cursor: pointer;
                    border: 2px solid transparent; }
        .cm-color.selected { border-color: var(--ink-800); }
        .cm-color-custom { width: 26px; height: 26px; border-radius: 7px; border: 1.5px dashed var(--line-strong);
                           display: flex; align-items: center; justify-content: center; color: var(--ink-500); cursor: pointer; }

        .cm-icon-grid { display: flex; gap: 6px; flex-wrap: wrap; }
        .cm-icon { width: 30px; height: 30px; border-radius: 7px; background: var(--cream-100);
                   border: 1px solid var(--line); display: flex; align-items: center; justify-content: center;
                   color: var(--ink-600); cursor: pointer; }
        .cm-icon.selected { background: var(--amber-100); border-color: var(--amber-500); color: var(--amber-500); }

        .cm-budget { display: flex; align-items: center; gap: 14px; }
        .cm-budget-input { display: flex; align-items: baseline; gap: 4px; background: var(--cream-100);
                           border: 1px solid var(--line); border-radius: 8px; padding: 6px 12px; }
        .cm-budget-input .num { font-family: var(--font-display); font-size: 28px; color: var(--ink-900); line-height: 1; }
        .cm-budget-input .cur { font-family: var(--font-display); font-size: 18px; color: var(--ink-500); }
        .cm-budget-bar { flex: 1; height: 6px; background: rgba(61,40,23,0.07); border-radius: 999px; position: relative; }
        .cm-budget-bar > .fill { height: 100%; background: var(--amber-500); border-radius: 999px; }
        .cm-budget-bar > .thumb { position: absolute; width: 16px; height: 16px; border-radius: 50%;
                                  background: var(--amber-500); top: -5px; border: 3px solid var(--cream-50);
                                  box-shadow: 0 1px 4px rgba(0,0,0,0.1); }

        /* Rules */
        .cm-rules-add { padding: 12px 18px; display: flex; align-items: center; gap: 10px;
                        background: var(--cream-100); border-top: 1px solid var(--line); border-bottom: 1px solid var(--line); }
        .cm-rule { display: grid; grid-template-columns: 18px 1fr 28px 24px 24px; gap: 10px; align-items: center;
                   padding: 10px 18px; border-bottom: 1px dashed var(--line); }
        .cm-rule:last-child { border-bottom: none; }
        .cm-rule-toggle { width: 28px; height: 16px; background: var(--sage-500); border-radius: 999px; position: relative; cursor: pointer; }
        .cm-rule-toggle::after { content: ""; position: absolute; right: 2px; top: 2px; width: 12px; height: 12px; border-radius: 50%; background: var(--cream-50); }
        .cm-rule-toggle.off { background: var(--cream-200); }
        .cm-rule-toggle.off::after { right: auto; left: 2px; }
        .cm-rule-body { display: flex; flex-direction: column; gap: 2px; }
        .cm-rule-cond { font-size: 12px; color: var(--ink-800); }
        .cm-rule-cond strong { font-family: var(--font-mono); background: var(--cream-200); padding: 1px 6px; border-radius: 4px; font-weight: 400; }
        .cm-rule-meta { font-size: 11px; color: var(--ink-500); }
        .cm-rule-count { font-family: var(--font-mono); font-size: 11px; color: var(--ink-700);
                         background: var(--cream-200); padding: 2px 7px; border-radius: 999px; }
      `}</style>

      <aside className="cm-side">
        <div className="cm-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"cm-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="cm-side-foot">
          <div className="cm-nav-btn"><IcSun size={18}/></div>
          <div className="cm-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="cm-main">
        <div className="cm-top">
          <div>
            <div className="cm-bread">Ambre · <strong>Catégories</strong></div>
            <h1 className="cm-h1">Gérer mes <em>catégories</em>.</h1>
          </div>
          <div className="cm-tool">
            <button className="cm-btn">Importer / Exporter</button>
            <button className="cm-btn amber"><IcPlus size={14}/>Nouvelle catégorie</button>
          </div>
        </div>

        <div className="cm-body">
          {/* LEFT */}
          <div className="cm-card">
            <div className="cm-card-h">
              <div>
                <div className="cm-card-t">{allCats.length} catégories</div>
                <div className="cm-card-s">glisser pour réordonner · cliquer pour éditer</div>
              </div>
              <button className="cm-btn" style={{ padding: "4px 8px", fontSize: 11 }}>
                <IcFilter size={11}/>Trier
              </button>
            </div>
            <div className="cm-search">
              <IcSearch size={13}/>
              <input placeholder="Rechercher une catégorie…" readOnly value=""/>
            </div>
            <div className="cm-list">
              {allCats.map(c => (
                <div key={c.id} className={"cm-list-row" + (c.id === "alim" ? " active" : "")}>
                  <span className="cm-drag">
                    <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
                      <circle cx="3" cy="3" r="1.2"/><circle cx="9" cy="3" r="1.2"/>
                      <circle cx="3" cy="7" r="1.2"/><circle cx="9" cy="7" r="1.2"/>
                      <circle cx="3" cy="11" r="1.2"/><circle cx="9" cy="11" r="1.2"/>
                    </svg>
                  </span>
                  <div className="cm-list-mark" style={{ background: c.color }}>{c.label[0].toLowerCase()}</div>
                  <div>
                    <div className="cm-list-name">{c.label}</div>
                    <div className="cm-list-meta">{c.amount > 0 ? "ce mois · " + fmtEUR(c.amount, 0) : "inactive"}</div>
                  </div>
                  <span className="cm-list-amt">{c.amount > 0 ? Math.round((c.share || 0) * 100) + "%" : "—"}</span>
                  <span style={{ color: "var(--ink-500)" }}><IcArrowR size={11}/></span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT */}
          <div className="cm-card">
            <div className="cm-card-h">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: selected.color, color: "var(--cream-50)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18 }}>a</div>
                <div>
                  <div className="cm-card-t" style={{ fontSize: 15 }}>{selected.label}</div>
                  <div className="cm-card-s">12 mois · 142 transactions · {fmtEUR(5612, 0)} cumulé</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="cm-btn">Voir le détail <IcArrowR size={12}/></button>
                <button className="cm-btn" style={{ color: "var(--rose-500)", borderColor: "rgba(168,90,72,0.3)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                  Supprimer
                </button>
              </div>
            </div>
            <div className="cm-editor">
              {/* Identity */}
              <div>
                <div className="cm-section-h">Identité</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div className="cm-row">
                    <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Nom</label>
                    <input className="cm-input" defaultValue="Alimentation"/>
                  </div>
                  <div className="cm-row">
                    <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Description</label>
                    <input className="cm-input" defaultValue="Courses, marchés, boulangerie, restaurants, livraisons"/>
                  </div>
                  <div className="cm-row">
                    <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Couleur</label>
                    <div className="cm-color-picker">
                      {colorOptions.map(c => (
                        <span key={c} className={"cm-color" + (c === "#b8693d" ? " selected" : "")}
                              style={{ background: c }}/>
                      ))}
                      <span className="cm-color-custom"><IcPlus size={14}/></span>
                    </div>
                  </div>
                  <div className="cm-row">
                    <label style={{ fontSize: 12, color: "var(--ink-600)" }}>Icône</label>
                    <div className="cm-icon-grid">
                      {[
                        { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 8l2-5h14l2 5"/><path d="M3 8v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8"/><circle cx="12" cy="14" r="3"/></svg>, sel: true },
                        { i: <IcTag size={16}/> },
                        { i: <IcWallet size={16}/> },
                        { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M6 8h12v12H6z"/><path d="M9 3v5M15 3v5"/></svg> },
                        { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="9" r="6"/><path d="M9 21l3-5 3 5"/></svg> },
                        { i: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M5 12a7 7 0 0 1 14 0v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/></svg> },
                        { i: <IcChart size={16}/> },
                      ].map((it, i) => (
                        <div key={i} className={"cm-icon" + (it.sel ? " selected" : "")}>{it.i}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Budget */}
              <div>
                <div className="cm-section-h">Budget mensuel</div>
                <div className="cm-budget">
                  <div className="cm-budget-input">
                    <span className="cur">€</span>
                    <span className="num">500</span>
                  </div>
                  <div className="cm-budget-bar">
                    <div className="fill" style={{ width: "97.4%" }}/>
                    <div className="thumb" style={{ left: "calc(97.4% - 8px)" }}/>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
                    487 € dépensés · 97 %
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 6 }}>
                  Une alerte sera envoyée à 85 % et 100 % · <span style={{ color: "var(--amber-500)", cursor: "pointer" }}>modifier les seuils →</span>
                </div>
              </div>

              {/* Rules */}
              <div>
                <div className="cm-section-h">Règles de classement automatique · 5 actives</div>
              </div>
            </div>

            <div className="cm-rules-add">
              <div style={{ flex: 1, fontSize: 12, color: "var(--ink-500)" }}>
                Une transaction sera classée en <strong style={{ color: selected.color }}>{selected.label}</strong> si elle correspond à une des règles ci-dessous.
              </div>
              <button className="cm-btn amber" style={{ padding: "6px 12px", fontSize: 11 }}>
                <IcPlus size={12}/>Nouvelle règle
              </button>
            </div>

            <div style={{ overflow: "auto" }}>
              {rules.map(r => (
                <div key={r.id} className="cm-rule">
                  <span className={"cm-rule-toggle" + (r.to !== "alim" ? " off" : "")}/>
                  <div className="cm-rule-body">
                    <div className="cm-rule-cond">
                      Si {r.when} <strong>« {r.op} »</strong>
                    </div>
                    <div className="cm-rule-meta">
                      → classer en <strong style={{ color: selected.color }}>{r.to === "alim" ? "Alimentation" : "Loisirs"}</strong>
                      {" · dernière correspondance : " + r.last}
                    </div>
                  </div>
                  <span className="cm-rule-count">{r.auto}</span>
                  <button className="cm-btn" style={{ padding: 0, width: 24, height: 24, justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/></svg>
                  </button>
                  <button className="cm-btn" style={{ padding: 0, width: 24, height: 24, justifyContent: "center", color: "var(--rose-500)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ScreenCategoriesManage = ScreenCategoriesManage;
