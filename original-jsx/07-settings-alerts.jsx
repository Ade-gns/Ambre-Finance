/* Écran — Paramètres / Alertes
   1440 × 900. Sub-nav Paramètres + section Alertes active. */

function ScreenSettingsAlerts() {
  const { CATEGORIES } = window.AMBRE_DATA;
  const navItems = [
    { icon: IcHome, label: "Tableau" },
    { icon: IcImport, label: "Importer" },
    { icon: IcList, label: "Transactions" },
    { icon: IcTag, label: "Catégories" },
    { icon: IcChart, label: "Évolution" },
    { icon: IcBell, label: "Alertes", badge: 2 },
    { icon: IcSettings, active: true, label: "Paramètres" },
  ];

  const settingsNav = [
    { id: "gen", label: "Général",                ico: IcSettings },
    { id: "acc", label: "Comptes & banques",      ico: IcWallet },
    { id: "cat", label: "Catégories & règles",    ico: IcTag },
    { id: "alt", label: "Alertes",                ico: IcBell, active: true, badge: 2 },
    { id: "bck", label: "Sauvegarde & données",   ico: IcLock },
    { id: "app", label: "Apparence",              ico: IcSun },
    { id: "abt", label: "À propos",               ico: IcDot },
  ];

  const alerts = [
    { id: 1, name: "Loyer encaissé",         cond: "Réception d'un virement contenant « salaire »", thr: "✓ détection",
      now: "12 mai",  state: "ok", on: true, type: "événement", cat: null,    color: "#6b7a4f" },
    { id: 2, name: "Budget Loisirs proche",  cond: "Dépenses Loisirs ≥ 85 % du budget mensuel",     thr: "85 / 100 €",
      now: "96,80 €", state: "warn", on: true, type: "seuil",     cat: "loi", color: "#a85a48" },
    { id: 3, name: "Budget Alimentation",    cond: "Dépenses Alimentation ≥ 90 % du budget mensuel", thr: "450 / 500 €",
      now: "487 €",   state: "warn", on: true, type: "seuil",     cat: "alim", color: "#b8693d" },
    { id: 4, name: "Transaction inhabituelle", cond: "Dépense > 200 € en dehors des récurrentes",   thr: "200 €",
      now: "—",       state: "ok", on: true, type: "anomalie",  cat: null, color: "#9d8b73" },
    { id: 5, name: "Solde courant bas",      cond: "Solde courant < 500 €",                          thr: "500 €",
      now: "3 284 €", state: "ok", on: false, type: "solde",   cat: null, color: "#3d2817" },
    { id: 6, name: "Abonnement nouveau",     cond: "Nouvelle transaction récurrente détectée",       thr: "— auto —",
      now: "—",       state: "ok", on: true, type: "événement", cat: "abo", color: "#cd8459" },
  ];

  const templates = [
    { name: "Plafond mensuel global",          desc: "Quand le total dépensé dépasse X €",            ico: "€" },
    { name: "Sans dépense en 7 jours",         desc: "Une catégorie n'a aucune transaction sur 7 j", ico: "○" },
    { name: "Augmentation > 30 %",             desc: "Une catégorie augmente fortement vs M−1",       ico: "↑" },
    { name: "Doublon potentiel",               desc: "Deux transactions identiques en 48h",           ico: "≈" },
  ];

  return (
    <div className="st-root">
      <style>{`
        .st-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
                   display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

        .st-side { background: var(--cream-50); border-right: 1px solid var(--line);
                   display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
        .st-logo { width: 38px; height: 38px; border-radius: 10px;
                   background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                   display: flex; align-items: center; justify-content: center;
                   font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
        .st-nav-btn { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                      color: var(--ink-500); position: relative; }
        .st-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
        .st-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                           border-radius: 999px; background: var(--rose-500); }
        .st-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

        .st-main { padding: 22px 28px 0; display: grid; grid-template-columns: 240px 1fr; gap: 20px;
                   overflow: hidden; height: 100%; }

        /* Sub nav */
        .st-sub { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }
        .st-sub-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; padding: 0 12px 6px; }
        .st-sub-title { font-family: var(--font-display); font-size: 24px; color: var(--ink-900); margin: 4px 0 12px; padding: 0 12px; letter-spacing: -0.01em; line-height: 1.1; }
        .st-sub-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px;
                       border-radius: 8px; color: var(--ink-700); font-size: 13px; cursor: pointer; }
        .st-sub-item:hover { background: var(--cream-50); }
        .st-sub-item.active { background: var(--cream-50); color: var(--ink-900); font-weight: 500;
                              border-left: 2px solid var(--amber-500); padding-left: 10px; }
        .st-sub-badge { margin-left: auto; background: var(--amber-500); color: var(--cream-50);
                        font-size: 10px; padding: 1px 6px; border-radius: 999px; }
        .st-sub-foot { margin-top: auto; padding: 12px; font-size: 11px; color: var(--ink-500);
                       border-top: 1px solid var(--line); display: flex; align-items: center; gap: 8px; }

        /* Right area */
        .st-content { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow: hidden; padding-bottom: 22px; }
        .st-content-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .st-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .st-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .st-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
                 color: var(--ink-900); letter-spacing: -0.01em; }
        .st-h1 em { font-style: italic; color: var(--amber-500); }
        .st-tool { display: flex; gap: 8px; align-items: center; }
        .st-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 12px; }
        .st-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }

        /* Channels card */
        .st-channels { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                       padding: 18px 22px; display: grid; grid-template-columns: 1fr 1fr 1fr;
                       gap: 18px; }
        .st-channel { display: flex; flex-direction: column; gap: 6px; }
        .st-channel-h { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--ink-500);
                        letter-spacing: 0.08em; text-transform: uppercase; }
        .st-channel-l { font-size: 13px; color: var(--ink-800); }
        .st-channel-d { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .st-tg { width: 32px; height: 18px; background: var(--sage-500); border-radius: 999px; position: relative; cursor: pointer; flex-shrink: 0; }
        .st-tg::after { content: ""; position: absolute; right: 2px; top: 2px; width: 14px; height: 14px;
                        border-radius: 50%; background: var(--cream-50); }
        .st-tg.off { background: var(--cream-200); }
        .st-tg.off::after { right: auto; left: 2px; }

        /* Alerts list */
        .st-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
                   display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        .st-card-h { padding: 16px 22px 12px; border-bottom: 1px solid var(--line);
                     display: flex; align-items: flex-start; justify-content: space-between; }
        .st-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .st-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .st-alert { display: grid; grid-template-columns: 36px 1fr 130px 110px 32px 36px 36px;
                    align-items: center; gap: 12px; padding: 12px 22px;
                    border-bottom: 1px dashed var(--line); }
        .st-alert:last-child { border-bottom: none; }
        .st-alert-ico { width: 36px; height: 36px; border-radius: 9px; display: flex; align-items: center; justify-content: center;
                        color: var(--cream-50); font-family: var(--font-display); font-style: italic; font-size: 16px; }
        .st-alert-name { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .st-alert-cond { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
        .st-alert-thr { font-family: var(--font-mono); font-size: 11px; color: var(--ink-700); text-align: right; }
        .st-alert-state { display: inline-flex; align-items: center; gap: 6px; font-family: var(--font-mono);
                          font-size: 11px; padding: 3px 9px; border-radius: 999px; }
        .st-alert-state.warn { background: rgba(184,105,61,0.10); color: var(--amber-500); }
        .st-alert-state.ok   { background: var(--cream-200); color: var(--ink-600); }

        /* Templates */
        .st-tpl-grid { padding: 12px 22px 18px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .st-tpl { padding: 12px 14px; border: 1px dashed var(--line-strong); border-radius: 10px;
                  display: flex; flex-direction: column; gap: 6px; cursor: pointer; background: var(--cream-100); }
        .st-tpl:hover { border-color: var(--amber-500); }
        .st-tpl-h { display: flex; align-items: center; justify-content: space-between; }
        .st-tpl-ico { width: 28px; height: 28px; border-radius: 7px; background: var(--cream-50);
                      display: flex; align-items: center; justify-content: center;
                      font-family: var(--font-display); font-style: italic; font-size: 15px; color: var(--amber-500); }
        .st-tpl-t { font-size: 12.5px; color: var(--ink-900); font-weight: 500; }
        .st-tpl-d { font-size: 11px; color: var(--ink-500); }
      `}</style>

      <aside className="st-side">
        <div className="st-logo">a</div>
        {navItems.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"st-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="st-side-foot">
          <div className="st-nav-btn"><IcSun size={18}/></div>
          <div className="st-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="st-main">
        {/* SUB NAV */}
        <aside className="st-sub">
          <div className="st-sub-title">Paramètres</div>
          <div className="st-sub-h">Préférences</div>
          {settingsNav.map(s => {
            const Ico = s.ico;
            return (
              <div key={s.id} className={"st-sub-item" + (s.active ? " active" : "")}>
                <Ico size={15}/>
                <span>{s.label}</span>
                {s.badge && <span className="st-sub-badge">{s.badge}</span>}
              </div>
            );
          })}
          <div className="st-sub-foot">
            <IcLock size={11}/>
            <span>Ambre v0.4.2 · local-first</span>
          </div>
        </aside>

        {/* CONTENT */}
        <div className="st-content">
          <div className="st-content-top">
            <div>
              <div className="st-bread">Paramètres · <strong>Alertes</strong></div>
              <h1 className="st-h1">Mes <em>alertes</em>.</h1>
            </div>
            <div className="st-tool">
              <button className="st-btn"><IcImport size={14}/>Importer un modèle</button>
              <button className="st-btn amber"><IcPlus size={14}/>Nouvelle alerte</button>
            </div>
          </div>

          {/* Channels */}
          <div className="st-channels">
            <div className="st-channel">
              <div className="st-channel-h"><IcBell size={12}/>Notification système</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span className="st-tg"/>
                <div>
                  <div className="st-channel-l">Activée</div>
                  <div className="st-channel-d">Une bulle apparaît dans Ambre</div>
                </div>
              </div>
            </div>
            <div className="st-channel">
              <div className="st-channel-h"><IcSun size={12}/>Notification OS</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span className="st-tg"/>
                <div>
                  <div className="st-channel-l">Bureau Linux</div>
                  <div className="st-channel-d">via libnotify · son désactivé</div>
                </div>
              </div>
            </div>
            <div className="st-channel">
              <div className="st-channel-h"><IcLock size={12}/>Hors-ligne uniquement</div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
                <span className="st-tg off"/>
                <div>
                  <div className="st-channel-l">Aucune e-mail / SMS</div>
                  <div className="st-channel-d">Cette app n'envoie jamais rien en ligne.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active alerts */}
          <div className="st-card">
            <div className="st-card-h">
              <div>
                <div className="st-card-t">Alertes configurées · {alerts.filter(a => a.on).length} actives</div>
                <div className="st-card-s">déclenchées à chaque import ou modification de transaction</div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="st-btn" style={{ padding: "4px 10px", fontSize: 11, background: "var(--amber-100)", color: "var(--amber-500)", borderColor: "rgba(184,105,61,0.3)" }}>Toutes</button>
                <button className="st-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Seuils</button>
                <button className="st-btn" style={{ padding: "4px 10px", fontSize: 11 }}>Anomalies</button>
              </div>
            </div>
            <div style={{ overflow: "auto" }}>
              {alerts.map(a => (
                <div key={a.id} className="st-alert">
                  <div className="st-alert-ico" style={{ background: a.color }}>
                    <IcBell size={16}/>
                  </div>
                  <div>
                    <div className="st-alert-name">{a.name}</div>
                    <div className="st-alert-cond">{a.cond}</div>
                  </div>
                  <span className="st-alert-thr">Seuil · {a.thr}</span>
                  <span className={"st-alert-state " + a.state}>
                    {a.state === "warn" ? "⚠ " : "○ "}
                    {a.now}
                  </span>
                  <span className={"st-tg" + (a.on ? "" : " off")}/>
                  <button className="st-btn" style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/></svg>
                  </button>
                  <button className="st-btn" style={{ padding: 0, width: 28, height: 28, justifyContent: "center", color: "var(--rose-500)" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="st-tpl-grid">
              <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase", marginTop: -4 }}>
                <span>Modèles prêts à activer</span>
                <span style={{ flex: 1, height: 1, background: "var(--line)" }}/>
              </div>
              {templates.map(tp => (
                <div key={tp.name} className="st-tpl">
                  <div className="st-tpl-h">
                    <div className="st-tpl-ico">{tp.ico}</div>
                    <span style={{ fontSize: 10, color: "var(--amber-500)", display: "flex", alignItems: "center", gap: 4 }}>
                      <IcPlus size={11}/>Activer
                    </span>
                  </div>
                  <div className="st-tpl-t">{tp.name}</div>
                  <div className="st-tpl-d">{tp.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

window.ScreenSettingsAlerts = ScreenSettingsAlerts;
