/* Sous-écrans Paramètres
   General · Comptes & banques · Sauvegarde · Apparence · À propos
   Tous 1440 × 900, shell partagé. */

const STG_NAV = [
  { id: "gen", label: "Général",                ico: IcSettings },
  { id: "acc", label: "Comptes & banques",      ico: IcWallet },
  { id: "cat", label: "Catégories & règles",    ico: IcTag },
  { id: "alt", label: "Alertes",                ico: IcBell, badge: 2 },
  { id: "bck", label: "Sauvegarde & données",   ico: IcLock },
  { id: "app", label: "Apparence",              ico: IcSun },
  { id: "abt", label: "À propos",               ico: IcDot },
];

const STG_SIDE_NAV = [
  { icon: IcHome, label: "Tableau" },
  { icon: IcImport, label: "Importer" },
  { icon: IcList, label: "Transactions" },
  { icon: IcTag, label: "Catégories" },
  { icon: IcChart, label: "Évolution" },
  { icon: IcBell, label: "Alertes", badge: 2 },
  { icon: IcSettings, active: true, label: "Paramètres" },
];

const STG_STYLES = `
  .stg-root { width: 1440px; height: 900px; background: #efe7d6; color: var(--ink-800);
              display: grid; grid-template-columns: 72px 1fr; font-size: 13px; }

  .stg-side { background: var(--cream-50); border-right: 1px solid var(--line);
              display: flex; flex-direction: column; padding: 20px 0; align-items: center; gap: 8px; }
  .stg-logo { width: 38px; height: 38px; border-radius: 10px;
              background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
              display: flex; align-items: center; justify-content: center;
              font-family: var(--font-display); font-size: 22px; font-style: italic; margin-bottom: 12px; }
  .stg-nav-btn { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center;
                 color: var(--ink-500); position: relative; }
  .stg-nav-btn.active { background: var(--amber-100); color: var(--amber-500); }
  .stg-nav-btn .bdg { position: absolute; top: 6px; right: 6px; width: 6px; height: 6px;
                      border-radius: 999px; background: var(--rose-500); }
  .stg-side-foot { margin-top: auto; display: flex; flex-direction: column; gap: 8px; align-items: center; }

  .stg-main { padding: 22px 28px 0; display: grid; grid-template-columns: 240px 1fr; gap: 20px;
              overflow: hidden; height: 100%; }

  .stg-sub { display: flex; flex-direction: column; gap: 4px; padding-top: 6px; }
  .stg-sub-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; padding: 0 12px 6px; }
  .stg-sub-title { font-family: var(--font-display); font-size: 24px; color: var(--ink-900); margin: 4px 0 12px; padding: 0 12px; letter-spacing: -0.01em; line-height: 1.1; }
  .stg-sub-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px;
                  border-radius: 8px; color: var(--ink-700); font-size: 13px; cursor: pointer; }
  .stg-sub-item.active { background: var(--cream-50); color: var(--ink-900); font-weight: 500;
                         border-left: 2px solid var(--amber-500); padding-left: 10px; }
  .stg-sub-badge { margin-left: auto; background: var(--amber-500); color: var(--cream-50);
                   font-size: 10px; padding: 1px 6px; border-radius: 999px; }
  .stg-sub-foot { margin-top: auto; padding: 12px; font-size: 11px; color: var(--ink-500);
                  border-top: 1px solid var(--line); display: flex; align-items: center; gap: 8px; }

  .stg-content { display: flex; flex-direction: column; gap: 14px; min-height: 0; overflow: auto; padding-bottom: 22px; }
  .stg-top { display: flex; align-items: flex-end; justify-content: space-between; }
  .stg-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
  .stg-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
  .stg-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400; margin: 4px 0 0;
            color: var(--ink-900); letter-spacing: -0.01em; }
  .stg-h1 em { font-style: italic; color: var(--amber-500); }

  .stg-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
             border: 1px solid var(--line); border-radius: 8px; background: var(--cream-50);
             color: var(--ink-700); font-size: 12px; }
  .stg-btn.amber { background: var(--amber-500); color: var(--cream-50); border-color: var(--amber-500); font-weight: 500; }
  .stg-btn.danger { color: var(--rose-500); border-color: rgba(168,90,72,0.3); }

  .stg-card { background: var(--cream-50); border: 1px solid var(--line); border-radius: 14px;
              padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
  .stg-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
  .stg-card-t { font-size: 14px; color: var(--ink-900); font-weight: 500; }
  .stg-card-s { font-size: 11.5px; color: var(--ink-500); margin-top: 3px; line-height: 1.5; max-width: 480px; }

  .stg-section-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.1em; text-transform: uppercase; }

  .stg-row { display: grid; grid-template-columns: 220px 1fr; gap: 24px; align-items: center;
             padding: 12px 0; border-bottom: 1px dashed var(--line); }
  .stg-row:last-child { border-bottom: none; }
  .stg-row-lbl { font-size: 13px; color: var(--ink-800); }
  .stg-row-sub { font-size: 11px; color: var(--ink-500); margin-top: 2px; line-height: 1.4; }
  .stg-row-ctrl { display: flex; align-items: center; gap: 10px; }

  .stg-input { background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px;
               padding: 7px 12px; font-size: 13px; color: var(--ink-800); font-family: inherit; min-width: 220px; }
  .stg-input:focus { outline: none; border-color: var(--amber-500); }
  .stg-select { display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px;
                background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px;
                font-size: 13px; color: var(--ink-800); min-width: 220px; justify-content: space-between; }

  .stg-tg { width: 36px; height: 20px; background: var(--sage-500); border-radius: 999px;
            position: relative; cursor: pointer; flex-shrink: 0; }
  .stg-tg::after { content: ""; position: absolute; right: 2px; top: 2px; width: 16px; height: 16px;
                   border-radius: 50%; background: var(--cream-50); }
  .stg-tg.off { background: var(--cream-200); }
  .stg-tg.off::after { right: auto; left: 2px; }

  .stg-segmented { display: inline-flex; padding: 3px; background: var(--cream-100); border: 1px solid var(--line); border-radius: 8px; gap: 2px; }
  .stg-segmented button { padding: 5px 12px; border-radius: 6px; font-size: 12px; color: var(--ink-600); background: transparent; border: none; }
  .stg-segmented button.active { background: var(--cream-50); color: var(--ink-800); font-weight: 500; border: 1px solid var(--line); }
`;

function SettingsShell({ activeId, title, breadcrumb, actions, children }) {
  return (
    <div className="stg-root">
      <style>{STG_STYLES}</style>

      <aside className="stg-side">
        <div className="stg-logo">a</div>
        {STG_SIDE_NAV.map((it, i) => {
          const Ico = it.icon;
          return (
            <div key={i} className={"stg-nav-btn" + (it.active ? " active" : "")} title={it.label}>
              <Ico size={18}/>
              {it.badge && <span className="bdg"/>}
            </div>
          );
        })}
        <div className="stg-side-foot">
          <div className="stg-nav-btn"><IcSun size={18}/></div>
          <div className="stg-nav-btn"><IcLock size={16}/></div>
        </div>
      </aside>

      <main className="stg-main">
        <aside className="stg-sub">
          <div className="stg-sub-title">Paramètres</div>
          <div className="stg-sub-h">Préférences</div>
          {STG_NAV.map(s => {
            const Ico = s.ico;
            return (
              <div key={s.id} className={"stg-sub-item" + (s.id === activeId ? " active" : "")}>
                <Ico size={15}/>
                <span>{s.label}</span>
                {s.badge && <span className="stg-sub-badge">{s.badge}</span>}
              </div>
            );
          })}
          <div className="stg-sub-foot">
            <IcLock size={11}/>
            <span>Ambre v0.4.2 · local-first</span>
          </div>
        </aside>

        <div className="stg-content">
          <div className="stg-top">
            <div>
              <div className="stg-bread">Paramètres · <strong>{breadcrumb}</strong></div>
              <h1 className="stg-h1" dangerouslySetInnerHTML={{ __html: title }}/>
            </div>
            <div style={{ display: "flex", gap: 8 }}>{actions}</div>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

/* ════════ GÉNÉRAL ════════ */
function ScreenSettingsGeneral() {
  return (
    <SettingsShell
      activeId="gen"
      breadcrumb="Général"
      title="Réglages <em>généraux</em>."
      actions={<button className="stg-btn amber">Enregistrer</button>}
    >
      <div className="stg-card">
        <div>
          <div className="stg-card-t">Profil</div>
          <div className="stg-card-s">Ces informations restent en local et servent uniquement à personnaliser l'interface.</div>
        </div>
        <div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Prénom</div>
              <div className="stg-row-sub">Affiché dans la salutation du tableau de bord.</div>
            </div>
            <div className="stg-row-ctrl"><input className="stg-input" defaultValue="Camille"/></div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Langue de l'interface</div>
              <div className="stg-row-sub">Le redémarrage est automatique.</div>
            </div>
            <div className="stg-row-ctrl">
              <span className="stg-select">🇫🇷 Français <IcChevDn size={12}/></span>
              <span style={{ fontSize: 11, color: "var(--ink-500)" }}>EN, DE et ES disponibles</span>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Fuseau horaire</div>
              <div className="stg-row-sub">Détecté depuis votre système.</div>
            </div>
            <div className="stg-row-ctrl">
              <span className="stg-select">Europe / Paris · UTC+2 <IcChevDn size={12}/></span>
            </div>
          </div>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Formats</div>
          <div className="stg-card-s">Comment les chiffres et dates sont écrits dans l'application.</div>
        </div>
        <div>
          <div className="stg-row">
            <div className="stg-row-lbl">Devise par défaut</div>
            <div className="stg-row-ctrl">
              <span className="stg-select">€ Euro (EUR) <IcChevDn size={12}/></span>
              <span style={{ fontSize: 11, color: "var(--ink-500)" }}>Multidevises : <strong>désactivé</strong> · <span style={{ color: "var(--amber-500)" }}>activer</span></span>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Format des montants</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                <button>1234.56 €</button>
                <button className="active">1 234,56 €</button>
                <button>1.234,56 €</button>
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Format de date</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                <button className="active">14/05/2026</button>
                <button>14 mai 2026</button>
                <button>2026-05-14</button>
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Premier jour de la semaine</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                <button className="active">Lundi</button>
                <button>Dimanche</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Comportement</div>
          <div className="stg-card-s">Comment Ambre se comporte au démarrage et à la fermeture.</div>
        </div>
        <div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Écran d'accueil</div>
              <div className="stg-row-sub">Première page affichée au lancement.</div>
            </div>
            <div className="stg-row-ctrl">
              <span className="stg-select">Tableau de bord <IcChevDn size={12}/></span>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Verrouiller au démarrage</div>
              <div className="stg-row-sub">Demande une phrase secrète à l'ouverture d'Ambre.</div>
            </div>
            <div className="stg-row-ctrl"><span className="stg-tg off"/></div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Lancer Ambre au démarrage du système</div>
              <div className="stg-row-sub">Démarre minimisé dans la barre de tâches.</div>
            </div>
            <div className="stg-row-ctrl"><span className="stg-tg off"/></div>
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}

/* ════════ COMPTES & BANQUES ════════ */
function ScreenSettingsAccounts() {
  const accounts = [
    { id: 1, name: "Compte courant", bank: "BNP Paribas", type: "Courant", color: "#b8693d", bal: 3284.40, last: "12 mai", tx: 142, parser: "PDF + CSV", on: true },
    { id: 2, name: "Livret A",        bank: "La Banque Postale", type: "Épargne", color: "#6b7a4f", bal: 8120.00, last: "08 avril", tx: 24, parser: "CSV", on: true },
    { id: 3, name: "PEA",             bank: "Boursorama", type: "Investissement", color: "#3d2817", bal: 12450.78, last: "01 mars", tx: 18, parser: "OFX", on: true },
    { id: 4, name: "Carte Revolut",   bank: "Revolut", type: "E-money", color: "#9d8b73", bal: 142.30, last: "30 avril", tx: 31, parser: "CSV", on: false },
  ];

  return (
    <SettingsShell
      activeId="acc"
      breadcrumb="Comptes & banques"
      title="Mes <em>comptes</em>."
      actions={<button className="stg-btn amber"><IcPlus size={14}/>Ajouter un compte</button>}
    >
      <div className="stg-card">
        <div className="stg-card-h">
          <div>
            <div className="stg-card-t">{accounts.length} comptes enregistrés</div>
            <div className="stg-card-s">
              Ambre stocke uniquement les informations nécessaires à la lecture de vos relevés.
              Aucune connexion bancaire n'est établie.
            </div>
          </div>
          <div className="stg-segmented">
            <button className="active">Tous</button>
            <button>Courants</button>
            <button>Épargne</button>
            <button>Investissement</button>
          </div>
        </div>
        <div>
          {accounts.map(a => (
            <div key={a.id} style={{ display: "grid", gridTemplateColumns: "44px 1.4fr 1fr 130px 100px 32px 28px 28px", gap: 14, alignItems: "center",
                                     padding: "14px 0", borderBottom: "1px dashed var(--line)" }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color, color: "var(--cream-50)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18 }}>{a.bank[0].toLowerCase()}</div>
              <div>
                <div style={{ fontSize: 13.5, color: "var(--ink-900)", fontWeight: 500 }}>{a.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{a.bank} · {a.type}</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink-900)" }}>{fmtEUR(a.bal, 0)}</div>
                <div style={{ fontSize: 10.5, color: "var(--ink-500)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{a.tx} transactions</div>
              </div>
              <span style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
                Dernier import · <br/><strong style={{ color: "var(--ink-800)" }}>{a.last}</strong>
              </span>
              <span style={{ fontSize: 10.5, padding: "3px 8px", borderRadius: 999, background: "var(--cream-200)",
                             color: "var(--ink-700)", fontFamily: "var(--font-mono)", justifySelf: "start" }}>
                {a.parser}
              </span>
              <span className={"stg-tg" + (a.on ? "" : " off")}/>
              <button className="stg-btn" style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/></svg>
              </button>
              <button className="stg-btn danger" style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="stg-card">
        <div className="stg-card-h">
          <div>
            <div className="stg-card-t">Parseurs personnalisés</div>
            <div className="stg-card-s">Ajoutez un parseur pour un format de relevé non reconnu — un fichier de configuration JSON suffit.</div>
          </div>
          <button className="stg-btn"><IcImport size={13}/>Importer un parseur</button>
        </div>
        <div style={{ padding: "12px 14px", background: "var(--cream-100)", borderRadius: 8, fontSize: 12, color: "var(--ink-600)",
                      fontFamily: "var(--font-mono)" }}>
          ~/.config/ambre/parsers/<span style={{ color: "var(--amber-500)" }}>*.json</span>
          <span style={{ marginLeft: 12, color: "var(--ink-500)" }}>· 2 parseurs chargés</span>
        </div>
      </div>
    </SettingsShell>
  );
}

/* ════════ SAUVEGARDE & DONNÉES ════════ */
function ScreenSettingsBackup() {
  return (
    <SettingsShell
      activeId="bck"
      breadcrumb="Sauvegarde & données"
      title="Vos <em>données</em>."
      actions={<button className="stg-btn"><IcLock size={13}/>Vérifier l'intégrité</button>}
    >
      <div className="stg-card">
        <div>
          <div className="stg-card-t">Base de données locale</div>
          <div className="stg-card-s">Toutes vos transactions, catégories et règles vivent dans un fichier SQLite unique. Vous pouvez le déplacer, le sauvegarder, l'ouvrir avec un autre outil.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div style={{ padding: "12px 14px", background: "var(--cream-100)", borderRadius: 10, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Taille</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink-900)", marginTop: 4 }}>4,8 Mo</div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>· 6 412 transactions</div>
          </div>
          <div style={{ padding: "12px 14px", background: "var(--cream-100)", borderRadius: 10, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Dernière sauvegarde</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink-900)", marginTop: 4 }}>il y a 2 j</div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>12 mai · 22h04</div>
          </div>
          <div style={{ padding: "12px 14px", background: "rgba(107,122,79,0.10)", borderRadius: 10, border: "1px solid rgba(107,122,79,0.25)" }}>
            <div style={{ fontSize: 10, color: "var(--sage-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Intégrité</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--sage-500)", marginTop: 4 }}>✓ OK</div>
            <div style={{ fontSize: 11, color: "var(--sage-500)", fontFamily: "var(--font-mono)" }}>checksum vérifié</div>
          </div>
        </div>

        <div className="stg-row">
          <div>
            <div className="stg-row-lbl">Emplacement</div>
            <div className="stg-row-sub">Le fichier reste accessible même si Ambre est désinstallée.</div>
          </div>
          <div className="stg-row-ctrl">
            <code style={{ fontSize: 12, color: "var(--ink-700)", background: "var(--cream-100)", padding: "6px 10px",
                          borderRadius: 6, fontFamily: "var(--font-mono)" }}>
              ~/.local/share/ambre/<strong style={{ color: "var(--amber-500)" }}>ambre.db</strong>
            </code>
            <button className="stg-btn">Changer…</button>
          </div>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Sauvegarde automatique</div>
          <div className="stg-card-s">Une copie chiffrée est créée à intervalle régulier dans un dossier de votre choix.</div>
        </div>
        <div>
          <div className="stg-row">
            <div className="stg-row-lbl">Activer les sauvegardes auto.</div>
            <div className="stg-row-ctrl"><span className="stg-tg"/></div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Fréquence</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                <button>Manuelle</button>
                <button>Quotidienne</button>
                <button className="active">Hebdomadaire</button>
                <button>Mensuelle</button>
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Chiffrement</div>
            <div className="stg-row-ctrl">
              <span className="stg-select">AES-256 · phrase passe <IcChevDn size={12}/></span>
              <span style={{ fontSize: 11, color: "var(--sage-500)" }}>● phrase définie</span>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Dossier de destination</div>
            <div className="stg-row-ctrl">
              <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--ink-700)",
                            background: "var(--cream-100)", padding: "6px 10px", borderRadius: 6 }}>
                ~/Documents/Ambre-backups/
              </code>
              <button className="stg-btn">Parcourir…</button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="stg-btn amber"><IcUpload size={13}/>Lancer une sauvegarde maintenant</button>
          <button className="stg-btn"><IcImport size={13}/>Restaurer depuis une sauvegarde</button>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Exporter</div>
          <div className="stg-card-s">Sortir vos données dans un format ouvert.</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { fmt: ".csv", desc: "Une ligne par transaction" },
            { fmt: ".json", desc: "Structure complète, règles incluses" },
            { fmt: ".ofx", desc: "Compatible MoneyDance, GnuCash" },
            { fmt: ".pdf", desc: "Rapport mensuel lisible" },
          ].map(f => (
            <button key={f.fmt} className="stg-btn" style={{ padding: "10px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--amber-500)", fontSize: 13 }}>{f.fmt}</span>
              <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{f.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stg-card" style={{ border: "1px dashed rgba(168,90,72,0.3)" }}>
        <div>
          <div className="stg-card-t" style={{ color: "var(--rose-500)" }}>Zone sensible</div>
          <div className="stg-card-s">Ces actions sont irréversibles. Une sauvegarde est fortement recommandée au préalable.</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="stg-btn danger">Effacer les transactions importées</button>
          <button className="stg-btn danger">Réinitialiser les catégories</button>
          <button className="stg-btn danger" style={{ background: "rgba(168,90,72,0.08)" }}>Tout effacer (DB + parsers)</button>
        </div>
      </div>
    </SettingsShell>
  );
}

/* ════════ APPARENCE ════════ */
function ScreenSettingsAppearance() {
  return (
    <SettingsShell
      activeId="app"
      breadcrumb="Apparence"
      title="Apparence et <em>confort</em>."
      actions={null}
    >
      <div className="stg-card">
        <div>
          <div className="stg-card-t">Thème</div>
          <div className="stg-card-s">Sombre ou clair, ou suit votre système.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { id: "clair", label: "Clair", bg: "#faf6ef", fg: "#3d2817", panel: "#f6f1ea", active: true },
            { id: "sombre", label: "Sombre", bg: "#14110d", fg: "#e8e0d0", panel: "#1c1814" },
            { id: "auto",   label: "Système", bg: "linear-gradient(135deg, #faf6ef 50%, #14110d 50%)", fg: "#3d2817", panel: "#f6f1ea" },
          ].map(t => (
            <div key={t.id} style={{ position: "relative", border: t.active ? "2px solid var(--amber-500)" : "1px solid var(--line)",
                                     borderRadius: 12, padding: 0, overflow: "hidden", cursor: "pointer" }}>
              <div style={{ height: 100, background: t.bg, padding: 12, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ height: 18, background: t.panel, borderRadius: 4, width: "40%" }}/>
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ height: 28, flex: 1, background: t.panel, borderRadius: 4 }}/>
                  <div style={{ height: 28, flex: 1, background: t.panel, borderRadius: 4 }}/>
                </div>
                <div style={{ height: 22, background: t.panel, borderRadius: 4 }}/>
              </div>
              <div style={{ padding: "10px 14px", background: "var(--cream-50)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 500 }}>{t.label}</span>
                {t.active && <span style={{ width: 14, height: 14, borderRadius: 999, background: "var(--amber-500)", color: "var(--cream-50)",
                                            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9 }}>✓</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Couleur d'accent</div>
          <div className="stg-card-s">Utilisée sur les CTA, les graphiques principaux et la sélection.</div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {[
            { c: "#b8693d", l: "Ambre", active: true },
            { c: "#a85a48", l: "Terracotta" },
            { c: "#6b7a4f", l: "Sauge" },
            { c: "#7a5c3a", l: "Bronze" },
            { c: "#3d2817", l: "Ink" },
          ].map(s => (
            <div key={s.l} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: s.c,
                            border: s.active ? "3px solid var(--ink-800)" : "3px solid transparent",
                            boxShadow: s.active ? "0 0 0 2px var(--cream-50) inset" : "none" }}/>
              <span style={{ fontSize: 11, color: "var(--ink-700)" }}>{s.l}</span>
            </div>
          ))}
          <div style={{ width: 42, height: 42, borderRadius: 12, border: "2px dashed var(--line-strong)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-500)", cursor: "pointer", marginLeft: 8 }}>
            <IcPlus size={18}/>
          </div>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Typographie</div>
          <div className="stg-card-s">Polices et tailles utilisées dans l'interface.</div>
        </div>
        <div>
          <div className="stg-row">
            <div className="stg-row-lbl">Famille de titres</div>
            <div className="stg-row-ctrl">
              <span className="stg-select"><em style={{ fontFamily: "var(--font-display)" }}>Instrument Serif</em> <IcChevDn size={12}/></span>
              <span style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22, color: "var(--amber-500)" }}>Ambre</span>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Famille du texte</div>
            <div className="stg-row-ctrl">
              <span className="stg-select">Geist Sans <IcChevDn size={12}/></span>
              <span style={{ fontSize: 16, color: "var(--ink-800)" }}>Le bon sens, financier.</span>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Taille générale</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                <button>Compacte</button>
                <button className="active">Normale</button>
                <button>Agréable</button>
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Densité des tableaux</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                <button>Compacte</button>
                <button className="active">Confortable</button>
                <button>Spacieuse</button>
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Réduire les animations</div>
              <div className="stg-row-sub">Désactive les transitions des graphiques.</div>
            </div>
            <div className="stg-row-ctrl"><span className="stg-tg off"/></div>
          </div>
        </div>
      </div>
    </SettingsShell>
  );
}

/* ════════ À PROPOS ════════ */
function ScreenSettingsAbout() {
  return (
    <SettingsShell
      activeId="abt"
      breadcrumb="À propos"
      title="À <em>propos</em> d'Ambre."
      actions={null}
    >
      <div className="stg-card" style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 28, alignItems: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 18,
                      background: "linear-gradient(140deg, #cd8459, #b8693d)",
                      color: "var(--cream-50)", display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44 }}>a</div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34, color: "var(--ink-900)", letterSpacing: "-0.01em" }}>Ambre</div>
          <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 4 }}>
            Une application desktop pour comprendre où va son argent — sans cloud, sans compte, sans bruit.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 12, fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
            <span>v0.4.2 <span style={{ background: "var(--cream-200)", padding: "1px 6px", borderRadius: 4, marginLeft: 4 }}>beta</span></span>
            <span>build a3f2c1d</span>
            <span>Tauri 2.1 + React 18</span>
            <span>Linux x86_64</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <button className="stg-btn">Vérifier les mises à jour</button>
          <button className="stg-btn">Historique des versions</button>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Ressources</div>
          <div className="stg-card-s">Liens utiles · ouverts dans votre navigateur par défaut.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { t: "Documentation",        s: "Guide d'utilisation, raccourcis, FAQ", ic: "?" },
            { t: "Code source",          s: "github.com/projet-ambre/ambre · MIT", ic: "{ }" },
            { t: "Signaler un problème", s: "Issue tracker public", ic: "!" },
            { t: "Communauté",           s: "Discussions, partage de parsers", ic: "@" },
          ].map(r => (
            <div key={r.t} style={{ display: "grid", gridTemplateColumns: "32px 1fr 16px", gap: 12, alignItems: "center",
                                    padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10,
                                    background: "var(--cream-100)", cursor: "pointer" }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: "var(--cream-50)", color: "var(--amber-500)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-mono)", fontSize: 14 }}>{r.ic}</div>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 500 }}>{r.t}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{r.s}</div>
              </div>
              <IcArrowR size={13} style={{ color: "var(--ink-500)" }}/>
            </div>
          ))}
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Dépendances open source</div>
          <div className="stg-card-s">Ambre n'existerait pas sans le travail de ces communautés.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, fontFamily: "var(--font-mono)", fontSize: 11.5 }}>
          {[
            ["Tauri", "Apache 2.0"], ["React", "MIT"], ["SQLite", "Public domain"], ["Recharts", "MIT"],
            ["Lucide", "ISC"], ["pdfplumber", "MIT"], ["pdf-parse", "MIT"], ["date-fns", "MIT"],
          ].map(([n, l]) => (
            <div key={n} style={{ padding: "8px 12px", background: "var(--cream-100)", borderRadius: 6,
                                  display: "flex", justifyContent: "space-between", color: "var(--ink-700)" }}>
              <span>{n}</span>
              <span style={{ color: "var(--ink-500)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "16px 0", fontSize: 12, color: "var(--ink-500)" }}>
        Conçu en France · <span style={{ color: "var(--rose-500)" }}>♡</span> · 2026
      </div>
    </SettingsShell>
  );
}

Object.assign(window, {
  ScreenSettingsGeneral,
  ScreenSettingsAccounts,
  ScreenSettingsBackup,
  ScreenSettingsAppearance,
  ScreenSettingsAbout,
});
