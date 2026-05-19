/* Écran Paramètres — 6 sous-vues navigables via la nav latérale
   1. gen  — Général (profil, formats, comportement)
   2. acc  — Comptes & banques
   3. alt  — Alertes (avec seuils, modèles, canaux de notification)
   4. bck  — Sauvegarde & données (SQLite, exports, zone sensible)
   5. app  — Apparence (thème, couleur d'accent, typographie)
   6. abt  — À propos */

import { useState, useRef, useEffect } from "react";
import { useLocalStorage } from "../lib/storage";
import { fmtEUR } from "../lib/chartPrimitives";
import {
  IcSettings, IcWallet, IcTag, IcBell, IcLock, IcSun, IcDot,
  IcChevDn, IcPlus, IcImport, IcUpload
} from "../lib/icons";

export default function Settings() {
  const [activeId, setActiveId] = useState("gen");

  const subNav = [
    { id: "gen", label: "Général",              ico: IcSettings },
    { id: "acc", label: "Comptes & banques",    ico: IcWallet },
    { id: "cat", label: "Catégories & règles",  ico: IcTag },
    { id: "alt", label: "Alertes",              ico: IcBell, badge: 2 },
    { id: "bck", label: "Sauvegarde & données", ico: IcLock },
    { id: "app", label: "Apparence",            ico: IcSun },
    { id: "abt", label: "À propos",             ico: IcDot },
  ];

  return (
    <main className="stg-main">
      <style>{STG_STYLES}</style>

      <aside className="stg-sub">
        <div className="stg-sub-title">Paramètres</div>
        <div className="stg-sub-h">Préférences</div>
        {subNav.map(s => {
          const Ico = s.ico;
          return (
            <div key={s.id}
                 className={"stg-sub-item" + (s.id === activeId ? " active" : "")}
                 onClick={() => setActiveId(s.id)}>
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
        {activeId === "gen" && <SettingsGeneral />}
        {activeId === "acc" && <SettingsAccounts />}
        {activeId === "cat" && <SettingsCategoriesRedirect />}
        {activeId === "alt" && <SettingsAlerts />}
        {activeId === "bck" && <SettingsBackup />}
        {activeId === "app" && <SettingsAppearance />}
        {activeId === "abt" && <SettingsAbout />}
      </div>
    </main>
  );
}

/* En-tête réutilisable pour chaque sous-écran */
function SubHeader({ breadcrumb, title, actions }) {
  return (
    <div className="stg-top">
      <div>
        <div className="stg-bread">Paramètres · <strong>{breadcrumb}</strong></div>
        <h1 className="stg-h1" dangerouslySetInnerHTML={{ __html: title }}/>
      </div>
      <div style={{ display: "flex", gap: 8 }}>{actions}</div>
    </div>
  );
}

/* ─────────── 1. Général ─────────── */
function SettingsGeneral() {
  const [montantFmt, setMontantFmt]     = useLocalStorage("stg.montantFmt", 1);
  const [dateFmt, setDateFmt]           = useLocalStorage("stg.dateFmt", 0);
  const [premierJour, setPremierJour]   = useLocalStorage("stg.premierJour", 0);
  const [verrouiller, setVerrouiller]   = useLocalStorage("stg.verrouiller", false);
  const [lancer, setLancer]             = useLocalStorage("stg.lancer", false);
  const [saved, setSaved]               = useState(false);
  const [lang, setLang]                 = useLocalStorage("stg.lang", "fr");
  const [tz, setTz]                     = useLocalStorage("stg.tz", "Europe/Paris");
  const [homeScreen, setHomeScreen]     = useLocalStorage("stg.homeScreen", "Tableau de bord");
  const [homeOpen, setHomeOpen]         = useState(false);
  const homeRef                         = useRef(null);
  const HOME_OPTIONS = ["Tableau de bord", "Transactions", "Catégories", "Évolution", "Alertes"];
  useEffect(() => {
    if (!homeOpen) return;
    const fn = e => { if (!homeRef.current?.contains(e.target)) setHomeOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [homeOpen]);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <SubHeader
        breadcrumb="Général"
        title='Réglages <em>généraux</em>.'
        actions={
          <button className="stg-btn amber" onClick={handleSave}
                  style={{ minWidth: 110, justifyContent: "center",
                           background: saved ? "var(--sage-500)" : undefined,
                           borderColor: saved ? "var(--sage-500)" : undefined }}>
            {saved ? "✓ Enregistré" : "Enregistrer"}
          </button>
        }
      />

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Profil</div>
          <div className="stg-card-s">
            Ces informations restent en local et servent uniquement à personnaliser l'interface.
          </div>
        </div>
        <div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Prénom</div>
              <div className="stg-row-sub">Affiché dans la salutation du tableau de bord.</div>
            </div>
            <div className="stg-row-ctrl">
              <input className="stg-input" defaultValue="Camille"/>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Langue de l'interface</div>
              <div className="stg-row-sub">Le redémarrage est automatique.</div>
            </div>
            <div className="stg-row-ctrl">
              <select className="stg-select" style={{ appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                      value={lang} onChange={e => setLang(e.target.value)}>
                <option value="fr">🇫🇷 Français</option>
                <option value="en">🇬🇧 English</option>
                <option value="de">🇩🇪 Deutsch</option>
                <option value="es">🇪🇸 Español</option>
              </select>
              <span style={{ fontSize: 11, color: "var(--ink-500)" }}>EN, DE et ES disponibles</span>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Fuseau horaire</div>
              <div className="stg-row-sub">Détecté depuis votre système.</div>
            </div>
            <div className="stg-row-ctrl">
              <select className="stg-select" style={{ appearance: "none", WebkitAppearance: "none", cursor: "pointer" }}
                      value={tz} onChange={e => setTz(e.target.value)}>
                <option value="Europe/Paris">Europe / Paris · UTC+2</option>
                <option value="Europe/London">Europe / London · UTC+1</option>
                <option value="America/New_York">America / New York · UTC-4</option>
                <option value="America/Los_Angeles">America / Los Angeles · UTC-7</option>
                <option value="Asia/Tokyo">Asia / Tokyo · UTC+9</option>
              </select>
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
              <span style={{ fontSize: 11, color: "var(--ink-500)" }}>
                Multidevises : <strong>désactivé</strong> · <span style={{ color: "var(--amber-500)" }}>activer</span>
              </span>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Format des montants</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                {["1234.56 €", "1 234,56 €", "1.234,56 €"].map((opt, i) => (
                  <button key={opt} className={i === montantFmt ? "active" : ""} onClick={() => setMontantFmt(i)}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Format de date</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                {["14/05/2026", "14 mai 2026", "2026-05-14"].map((opt, i) => (
                  <button key={opt} className={i === dateFmt ? "active" : ""} onClick={() => setDateFmt(i)}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Premier jour de la semaine</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                {["Lundi", "Dimanche"].map((opt, i) => (
                  <button key={opt} className={i === premierJour ? "active" : ""} onClick={() => setPremierJour(i)}>{opt}</button>
                ))}
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
              <div ref={homeRef} style={{ position: "relative" }}>
                <span className="stg-select" style={{ cursor: "pointer" }}
                      onClick={() => setHomeOpen(o => !o)}>
                  {homeScreen} <IcChevDn size={12}/>
                </span>
                {homeOpen && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 50,
                    background: "var(--cream-50)", border: "1px solid var(--line)",
                    borderRadius: 10, boxShadow: "0 8px 24px rgba(61,40,23,0.12)",
                    minWidth: 200, overflow: "hidden",
                  }}>
                    {HOME_OPTIONS.map(opt => (
                      <button key={opt} style={{
                        display: "block", width: "100%", padding: "9px 14px",
                        background: opt === homeScreen ? "var(--amber-100)" : "none",
                        color: opt === homeScreen ? "var(--amber-500)" : "var(--ink-800)",
                        border: "none", borderBottom: "1px solid var(--line)",
                        cursor: "pointer", fontSize: 13, textAlign: "left",
                      }} onClick={() => { setHomeScreen(opt); setHomeOpen(false); }}>{opt}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Verrouiller au démarrage</div>
              <div className="stg-row-sub">Demande une phrase secrète à l'ouverture d'Ambre.</div>
            </div>
            <div className="stg-row-ctrl">
              <span className={"stg-tg" + (verrouiller ? "" : " off")} onClick={() => setVerrouiller(v => !v)}/>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Lancer Ambre au démarrage du système</div>
              <div className="stg-row-sub">Démarre minimisé dans la barre de tâches.</div>
            </div>
            <div className="stg-row-ctrl">
              <span className={"stg-tg" + (lancer ? "" : " off")} onClick={() => setLancer(v => !v)}/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────── 2. Comptes & banques ─────────── */
function SettingsAccounts() {
  const FILTERS = ["Tous", "Courant", "Épargne", "Investissement"];
  const [filter, setFilter]           = useState("Tous");
  const [accounts, setAccounts]       = useState([
    { id: 1, name: "Compte courant", bank: "BNP Paribas",       type: "Courant",        color: "#b8693d", bal: 3284.40,  last: "12 mai",   tx: 142, parser: "PDF + CSV", on: true },
    { id: 2, name: "Livret A",       bank: "La Banque Postale", type: "Épargne",        color: "#6b7a4f", bal: 8120.00,  last: "08 avril", tx: 24,  parser: "CSV",        on: true },
    { id: 3, name: "PEA",            bank: "Boursorama",        type: "Investissement", color: "#3d2817", bal: 12450.78, last: "01 mars",  tx: 18,  parser: "OFX",        on: true },
    { id: 4, name: "Carte Revolut",  bank: "Revolut",           type: "E-money",        color: "#9d8b73", bal: 142.30,   last: "30 avril", tx: 31,  parser: "CSV",        on: false },
  ]);
  const [editId, setEditId]           = useState(null);
  const [draft, setDraft]             = useState({});
  const [deleteId, setDeleteId]       = useState(null);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccName, setNewAccName]   = useState("");
  const [newAccBank, setNewAccBank]   = useState("");
  const [newAccType, setNewAccType]   = useState("Courant");
  const [newAccColor, setNewAccColor] = useState("#b8693d");
  const ACC_COLORS = ["#b8693d","#cd8459","#6b7a4f","#3d2817","#9d8b73","#a85a48"];
  const createAccount = () => {
    if (!newAccName.trim() || !newAccBank.trim()) return;
    setAccounts(prev => [...prev, {
      id: Date.now(), name: newAccName.trim(), bank: newAccBank.trim(),
      type: newAccType, color: newAccColor, bal: 0, last: "—", tx: 0, parser: "CSV", on: true,
    }]);
    setNewAccName(""); setNewAccBank(""); setNewAccType("Courant"); setNewAccColor("#b8693d");
    setShowAddAccount(false);
  };

  const toggleAccount = id => setAccounts(prev => prev.map(a => a.id === id ? { ...a, on: !a.on } : a));

  const startEdit = a => { setEditId(a.id); setDraft({ name: a.name, bank: a.bank }); setDeleteId(null); };
  const saveEdit  = id => { setAccounts(prev => prev.map(a => a.id === id ? { ...a, ...draft } : a)); setEditId(null); };

  const confirmDelete = id => {
    if (deleteId === id) { setAccounts(prev => prev.filter(a => a.id !== id)); setDeleteId(null); }
    else { setDeleteId(id); setEditId(null); setTimeout(() => setDeleteId(d => d === id ? null : d), 3000); }
  };

  const visible = filter === "Tous" ? accounts : accounts.filter(a => a.type === filter);

  return (
    <>
      <SubHeader
        breadcrumb="Comptes & banques"
        title='Mes <em>comptes</em>.'
        actions={<button className="stg-btn amber" onClick={() => setShowAddAccount(true)}><IcPlus size={14}/>Ajouter un compte</button>}
      />

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
            {FILTERS.map(f => (
              <button key={f} className={f === filter ? "active" : ""} onClick={() => setFilter(f)}>{f}</button>
            ))}
          </div>
        </div>
        <div>
          {visible.map(a => (
            <div key={a.id} style={{ borderBottom: "1px dashed var(--line)" }}>
              {editId === a.id ? (
                <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 0" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: a.color, flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "var(--cream-50)", fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18 }}>
                    {a.bank[0].toLowerCase()}
                  </div>
                  <input className="stg-input" value={draft.name} style={{ flex: 1 }}
                         onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}/>
                  <input className="stg-input" value={draft.bank} style={{ flex: 1 }}
                         onChange={e => setDraft(d => ({ ...d, bank: e.target.value }))}/>
                  <button className="stg-btn amber" onClick={() => saveEdit(a.id)}>Enregistrer</button>
                  <button className="stg-btn" onClick={() => setEditId(null)}>Annuler</button>
                </div>
              ) : deleteId === a.id ? (
                <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0",
                              background: "rgba(168,90,72,0.05)", borderRadius: 8, paddingLeft: 12 }}>
                  <span style={{ flex: 1, fontSize: 13, color: "var(--rose-500)" }}>
                    Supprimer « {a.name} » ? Cette action est irréversible.
                  </span>
                  <button className="stg-btn danger" style={{ borderColor: "var(--rose-500)" }}
                          onClick={() => confirmDelete(a.id)}>Confirmer</button>
                  <button className="stg-btn" onClick={() => setDeleteId(null)}>Annuler</button>
                </div>
              ) : (
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "44px 1.4fr 1fr 130px 100px 32px 28px 28px",
                  gap: 14, alignItems: "center", padding: "14px 0",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10, background: a.color,
                    color: "var(--cream-50)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 18
                  }}>{a.bank[0].toLowerCase()}</div>
                  <div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-900)", fontWeight: 500 }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{a.bank} · {a.type}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 20, color: "var(--ink-900)" }}>
                      {fmtEUR(a.bal, 0)}
                    </div>
                    <div style={{ fontSize: 10.5, color: "var(--ink-500)", fontFamily: "var(--font-mono)", marginTop: 2 }}>
                      {a.tx} transactions
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
                    Dernier import · <br/><strong style={{ color: "var(--ink-800)" }}>{a.last}</strong>
                  </span>
                  <span style={{
                    fontSize: 10.5, padding: "3px 8px", borderRadius: 999,
                    background: "var(--cream-200)", color: "var(--ink-700)",
                    fontFamily: "var(--font-mono)", justifySelf: "start"
                  }}>{a.parser}</span>
                  <span className={"stg-tg" + (a.on ? "" : " off")} onClick={() => toggleAccount(a.id)}/>
                  <button className="stg-btn" onClick={() => startEdit(a)}
                          style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/>
                    </svg>
                  </button>
                  <button className="stg-btn danger" onClick={() => confirmDelete(a.id)}
                          style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="stg-card">
        <div className="stg-card-h">
          <div>
            <div className="stg-card-t">Parseurs personnalisés</div>
            <div className="stg-card-s">
              Ajoutez un parseur pour un format de relevé non reconnu — un fichier de configuration JSON suffit.
            </div>
          </div>
          <button className="stg-btn"><IcImport size={13}/>Importer un parseur</button>
        </div>
        <div style={{
          padding: "12px 14px", background: "var(--cream-100)", borderRadius: 8,
          fontSize: 12, color: "var(--ink-600)", fontFamily: "var(--font-mono)"
        }}>
          ~/.config/ambre/parsers/<span style={{ color: "var(--amber-500)" }}>*.json</span>
          <span style={{ marginLeft: 12, color: "var(--ink-500)" }}>· 2 parseurs chargés</span>
        </div>
      </div>

      {/* Modal — ajouter un compte */}
      {showAddAccount && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "rgba(61,40,23,0.35)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setShowAddAccount(false)}>
          <div style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 440,
            boxShadow: "0 24px 60px rgba(61,40,23,0.18)",
            display: "flex", flexDirection: "column", gap: 20,
          }} onClick={e => e.stopPropagation()}>
            <div>
              <div style={{ fontSize: 17, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                Ajouter un compte
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 4 }}>
                Aucune connexion bancaire — vos données restent en local.
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Nom du compte</label>
                <input className="stg-input" style={{ width: "100%", boxSizing: "border-box" }}
                       placeholder="ex. Compte courant, Livret A…"
                       value={newAccName} onChange={e => setNewAccName(e.target.value)} autoFocus/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Banque</label>
                <input className="stg-input" style={{ width: "100%", boxSizing: "border-box" }}
                       placeholder="ex. BNP Paribas, Boursorama…"
                       value={newAccBank} onChange={e => setNewAccBank(e.target.value)}/>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 6 }}>Type</label>
                <select className="stg-input" style={{ width: "100%", boxSizing: "border-box" }}
                        value={newAccType} onChange={e => setNewAccType(e.target.value)}>
                  {["Courant", "Épargne", "Investissement", "E-money"].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-600)", textTransform: "uppercase",
                                letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>Couleur</label>
                <div style={{ display: "flex", gap: 8 }}>
                  {ACC_COLORS.map(c => (
                    <span key={c} onClick={() => setNewAccColor(c)} style={{
                      width: 30, height: 30, borderRadius: 8, background: c, cursor: "pointer",
                      border: c === newAccColor ? "2.5px solid var(--ink-900)" : "2px solid transparent",
                    }}/>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="stg-btn" onClick={() => setShowAddAccount(false)}>Annuler</button>
              <button className="stg-btn amber" onClick={createAccount}
                      style={{ opacity: newAccName.trim() && newAccBank.trim() ? 1 : 0.5 }}>
                <IcPlus size={13}/>Ajouter
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─────────── 3. Catégories & règles (renvoie vers /categories) ─────────── */
function SettingsCategoriesRedirect() {
  return (
    <>
      <SubHeader
        breadcrumb="Catégories & règles"
        title='Vos <em>catégories</em>.'
        actions={null}
      />
      <div className="stg-card" style={{ alignItems: "center", textAlign: "center", padding: "40px 24px" }}>
        <IcTag size={36} style={{ color: "var(--amber-500)" }}/>
        <div className="stg-card-t" style={{ fontSize: 16, marginTop: 8 }}>
          La gestion des catégories a son propre écran.
        </div>
        <div className="stg-card-s" style={{ fontSize: 13, maxWidth: 460 }}>
          Pour ajouter, modifier ou réordonner les catégories et leurs règles de classement automatique,
          rendez-vous sur l'icône <strong>🏷️ Catégories</strong> dans la barre latérale gauche.
        </div>
      </div>
    </>
  );
}

/* ─────────── 4. Alertes ─────────── */
function SettingsAlerts() {
  const [channels, setChannels] = useLocalStorage("stg.channels", { systeme: true, os: true, offline: false });
  const [alertFilter, setAlertFilter] = useState("Toutes");
  const [alerts, setAlerts] = useState([
    { id: 1, name: "Loyer encaissé",            cond: "Réception d'un virement contenant « salaire »",   thr: "✓ détection",   now: "12 mai",   state: "ok",   on: true,  color: "#6b7a4f" },
    { id: 2, name: "Budget Loisirs proche",     cond: "Dépenses Loisirs ≥ 85 % du budget mensuel",        thr: "85 / 100 €",    now: "96,80 €",  state: "warn", on: true,  color: "#a85a48" },
    { id: 3, name: "Budget Alimentation",       cond: "Dépenses Alimentation ≥ 90 % du budget mensuel",   thr: "450 / 500 €",   now: "487 €",    state: "warn", on: true,  color: "#b8693d" },
    { id: 4, name: "Transaction inhabituelle",  cond: "Dépense > 200 € en dehors des récurrentes",        thr: "200 €",         now: "—",        state: "ok",   on: true,  color: "#9d8b73" },
    { id: 5, name: "Solde courant bas",         cond: "Solde courant < 500 €",                            thr: "500 €",         now: "3 284 €",  state: "ok",   on: false, color: "#3d2817" },
    { id: 6, name: "Abonnement nouveau",        cond: "Nouvelle transaction récurrente détectée",         thr: "— auto —",      now: "—",        state: "ok",   on: true,  color: "#cd8459" },
  ]);
  const templates = [
    { name: "Plafond mensuel global",   desc: "Quand le total dépensé dépasse X €",          ico: "€" },
    { name: "Sans dépense en 7 jours",  desc: "Une catégorie n'a aucune transaction sur 7 j", ico: "○" },
    { name: "Augmentation > 30 %",      desc: "Une catégorie augmente fortement vs M−1",      ico: "↑" },
    { name: "Doublon potentiel",        desc: "Deux transactions identiques en 48h",          ico: "≈" },
  ];

  const [editAlertId, setEditAlertId]   = useState(null);
  const [alertDraft, setAlertDraft]     = useState({});
  const [deleteAlertId, setDeleteAlertId] = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [newAlert, setNewAlert]         = useState({ name: "", cond: "", thr: "" });
  const [activatedTpl, setActivatedTpl] = useState(null);

  const COLORS = ["#b8693d","#a85a48","#6b7a4f","#9d8b73","#3d2817","#cd8459"];

  const toggleAlert = id => setAlerts(prev => prev.map(a => a.id === id ? { ...a, on: !a.on } : a));

  const startEditAlert = a => { setEditAlertId(a.id); setAlertDraft({ name: a.name, cond: a.cond, thr: a.thr }); setDeleteAlertId(null); };
  const saveEditAlert  = id => { setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...alertDraft } : a)); setEditAlertId(null); };

  const confirmDeleteAlert = id => {
    if (deleteAlertId === id) { setAlerts(prev => prev.filter(a => a.id !== id)); setDeleteAlertId(null); }
    else { setDeleteAlertId(id); setEditAlertId(null); setTimeout(() => setDeleteAlertId(d => d === id ? null : d), 3000); }
  };

  const addAlert = () => {
    if (!newAlert.name.trim()) return;
    setAlerts(prev => [...prev, {
      id: Date.now(), name: newAlert.name,
      cond: newAlert.cond || "Condition personnalisée",
      thr: newAlert.thr || "— custom —",
      now: "—", state: "ok", on: true,
      color: COLORS[prev.length % COLORS.length],
    }]);
    setNewAlert({ name: "", cond: "", thr: "" });
    setShowForm(false);
  };

  const activateTemplate = tp => {
    setAlerts(prev => [...prev, {
      id: Date.now(), name: tp.name, cond: tp.desc,
      thr: "— auto —", now: "—", state: "ok", on: true,
      color: COLORS[prev.length % COLORS.length],
    }]);
    setActivatedTpl(tp.name);
    setTimeout(() => setActivatedTpl(null), 2000);
  };

  const ALERT_FILTERS = ["Toutes", "Seuils", "Anomalies"];
  const visible = alertFilter === "Toutes" ? alerts
    : alertFilter === "Seuils" ? alerts.filter(a => a.thr !== "✓ détection" && a.thr !== "— auto —")
    : alerts.filter(a => a.state === "warn");

  return (
    <>
      <SubHeader
        breadcrumb="Alertes"
        title='Mes <em>alertes</em>.'
        actions={<>
          <button className="stg-btn"><IcImport size={14}/>Importer un modèle</button>
          <button className="stg-btn amber" onClick={() => { setShowForm(v => !v); setEditAlertId(null); }}>
            <IcPlus size={14}/>{showForm ? "Annuler" : "Nouvelle alerte"}
          </button>
        </>}
      />

      {showForm && (
        <div className="stg-card" style={{ border: "1px solid var(--amber-500)" }}>
          <div className="stg-card-t">Nouvelle alerte</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div className="stg-row" style={{ padding: "8px 0" }}>
              <div className="stg-row-lbl">Nom</div>
              <input className="stg-input" placeholder="ex. Budget Vacances" value={newAlert.name}
                     onChange={e => setNewAlert(d => ({ ...d, name: e.target.value }))}/>
            </div>
            <div className="stg-row" style={{ padding: "8px 0" }}>
              <div className="stg-row-lbl">Condition</div>
              <input className="stg-input" placeholder="ex. Dépenses Vacances ≥ 80 %" value={newAlert.cond}
                     onChange={e => setNewAlert(d => ({ ...d, cond: e.target.value }))}/>
            </div>
            <div className="stg-row" style={{ padding: "8px 0", borderBottom: "none" }}>
              <div className="stg-row-lbl">Seuil</div>
              <input className="stg-input" placeholder="ex. 800 €" value={newAlert.thr}
                     onChange={e => setNewAlert(d => ({ ...d, thr: e.target.value }))}/>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="stg-btn amber" onClick={addAlert}>
              <IcPlus size={13}/>Ajouter l'alerte
            </button>
            <button className="stg-btn" onClick={() => setShowForm(false)}>Annuler</button>
          </div>
        </div>
      )}

      {/* Canaux de notification */}
      <div className="stg-channels">
        <div className="stg-channel">
          <div className="stg-channel-h"><IcBell size={12}/>Notification système</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <span className={"stg-tg-mini" + (channels.systeme ? "" : " off")}
                  onClick={() => setChannels(c => ({ ...c, systeme: !c.systeme }))}/>
            <div>
              <div className="stg-channel-l">{channels.systeme ? "Activée" : "Désactivée"}</div>
              <div className="stg-channel-d">Une bulle apparaît dans Ambre</div>
            </div>
          </div>
        </div>
        <div className="stg-channel">
          <div className="stg-channel-h"><IcSun size={12}/>Notification OS</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <span className={"stg-tg-mini" + (channels.os ? "" : " off")}
                  onClick={() => setChannels(c => ({ ...c, os: !c.os }))}/>
            <div>
              <div className="stg-channel-l">{channels.os ? "Bureau Linux" : "Désactivée"}</div>
              <div className="stg-channel-d">via libnotify · son désactivé</div>
            </div>
          </div>
        </div>
        <div className="stg-channel">
          <div className="stg-channel-h"><IcLock size={12}/>Hors-ligne uniquement</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
            <span className={"stg-tg-mini" + (channels.offline ? "" : " off")}
                  onClick={() => setChannels(c => ({ ...c, offline: !c.offline }))}/>
            <div>
              <div className="stg-channel-l">Aucun e-mail / SMS</div>
              <div className="stg-channel-d">Cette app n'envoie jamais rien en ligne.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Liste des alertes */}
      <div className="stg-alerts-card">
        <div className="stg-card-h" style={{ padding: "16px 22px 12px", borderBottom: "1px solid var(--line)" }}>
          <div>
            <div className="stg-card-t">Alertes configurées · {alerts.filter(a => a.on).length} actives</div>
            <div className="stg-card-s">déclenchées à chaque import ou modification de transaction</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            {ALERT_FILTERS.map(f => (
              <button key={f} className="stg-btn" onClick={() => setAlertFilter(f)} style={{
                padding: "4px 10px", fontSize: 11,
                background: f === alertFilter ? "var(--amber-100)" : undefined,
                color:      f === alertFilter ? "var(--amber-500)" : undefined,
                borderColor: f === alertFilter ? "rgba(184,105,61,0.3)" : undefined,
              }}>{f}</button>
            ))}
          </div>
        </div>
        {visible.map(a => (
          <div key={a.id}>
          {editAlertId === a.id ? (
            <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "12px 22px",
                          borderBottom: "1px dashed var(--line)", background: "var(--cream-100)" }}>
              <div className="stg-alert-ico" style={{ background: a.color, flexShrink: 0 }}><IcBell size={16}/></div>
              <input className="stg-input" value={alertDraft.name} style={{ flex: 1 }}
                     onChange={e => setAlertDraft(d => ({ ...d, name: e.target.value }))}/>
              <input className="stg-input" value={alertDraft.cond} style={{ flex: 2 }}
                     onChange={e => setAlertDraft(d => ({ ...d, cond: e.target.value }))}/>
              <input className="stg-input" value={alertDraft.thr} style={{ width: 110 }}
                     onChange={e => setAlertDraft(d => ({ ...d, thr: e.target.value }))}/>
              <button className="stg-btn amber" onClick={() => saveEditAlert(a.id)}>Enregistrer</button>
              <button className="stg-btn" onClick={() => setEditAlertId(null)}>Annuler</button>
            </div>
          ) : deleteAlertId === a.id ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px",
                          borderBottom: "1px dashed var(--line)", background: "rgba(168,90,72,0.05)" }}>
              <span style={{ flex: 1, fontSize: 13, color: "var(--rose-500)" }}>
                Supprimer « {a.name} » ?
              </span>
              <button className="stg-btn danger" style={{ borderColor: "var(--rose-500)" }}
                      onClick={() => confirmDeleteAlert(a.id)}>Confirmer</button>
              <button className="stg-btn" onClick={() => setDeleteAlertId(null)}>Annuler</button>
            </div>
          ) : (
          <div className="stg-alert">
            <div className="stg-alert-ico" style={{ background: a.color }}>
              <IcBell size={16}/>
            </div>
            <div>
              <div className="stg-alert-name">{a.name}</div>
              <div className="stg-alert-cond">{a.cond}</div>
            </div>
            <span className="stg-alert-thr">Seuil · {a.thr}</span>
            <span className={"stg-alert-state " + a.state}>
              {a.state === "warn" ? "⚠ " : "○ "}
              {a.now}
            </span>
            <span className={"stg-tg" + (a.on ? "" : " off")} onClick={() => toggleAlert(a.id)}/>
            <button className="stg-btn" onClick={() => startEditAlert(a)}
                    style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4v16h16v-7"/><path d="M18 2l4 4-12 12H6v-4z"/>
              </svg>
            </button>
            <button className="stg-btn danger" onClick={() => confirmDeleteAlert(a.id)}
                    style={{ padding: 0, width: 28, height: 28, justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </button>
          </div>
          )}
          </div>
        ))}

        {/* Modèles d'alertes */}
        <div className="stg-tpl-grid">
          <div style={{
            gridColumn: "1 / -1",
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 11, color: "var(--ink-500)",
            letterSpacing: "0.08em", textTransform: "uppercase",
            marginTop: -4
          }}>
            <span>Modèles prêts à activer</span>
            <span style={{ flex: 1, height: 1, background: "var(--line)" }}/>
          </div>
          {templates.map(tp => {
            const done = activatedTpl === tp.name;
            return (
              <div key={tp.name} className="stg-tpl" onClick={() => !done && activateTemplate(tp)}
                   style={{ borderColor: done ? "var(--sage-500)" : undefined }}>
                <div className="stg-tpl-h">
                  <div className="stg-tpl-ico">{tp.ico}</div>
                  <span style={{ fontSize: 10, display: "flex", alignItems: "center", gap: 4,
                                 color: done ? "var(--sage-500)" : "var(--amber-500)" }}>
                    {done ? "✓ Ajoutée" : <><IcPlus size={11}/>Activer</>}
                  </span>
                </div>
                <div className="stg-tpl-t">{tp.name}</div>
                <div className="stg-tpl-d">{tp.desc}</div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─────────── 5. Sauvegarde & données ─────────── */
function SettingsBackup() {
  const FREQ = ["Manuelle", "Quotidienne", "Hebdomadaire", "Mensuelle"];
  const [backupOn, setBackupOn]       = useLocalStorage("stg.backupOn", false);
  const [freq, setFreq]               = useLocalStorage("stg.backupFreq", 2);
  const [integrity, setIntegrity]     = useState("idle");   // idle | checking | ok
  const [backupRun, setBackupRun]     = useState("idle");   // idle | running | done
  const [exportDone, setExportDone]   = useState(null);     // null | ".csv" | ...
  const [danger, setDanger]           = useState(null);     // null | "tx" | "cat" | "all"
  const [dbPath, setDbPath]           = useState("ambre.db");
  const [backupFolder, setBackupFolder] = useState("~/Documents/Ambre-backups/");
  const [restoreMsg, setRestoreMsg]   = useState(null);
  const dbFileRef                     = useRef(null);
  const backupFolderRef               = useRef(null);
  const restoreRef                    = useRef(null);

  const checkIntegrity = () => {
    setIntegrity("checking");
    setTimeout(() => { setIntegrity("ok"); setTimeout(() => setIntegrity("idle"), 3000); }, 1400);
  };

  const launchBackup = () => {
    setBackupRun("running");
    setTimeout(() => { setBackupRun("done"); setTimeout(() => setBackupRun("idle"), 2500); }, 1800);
  };

  const handleExport = fmt => {
    setExportDone(fmt);
    setTimeout(() => setExportDone(null), 2000);
  };

  const handleDanger = key => {
    if (danger === key) { setDanger(null); }
    else { setDanger(key); setTimeout(() => setDanger(d => d === key ? null : d), 3000); }
  };

  return (
    <>
      <SubHeader
        breadcrumb="Sauvegarde & données"
        title='Vos <em>données</em>.'
        actions={
          <button className="stg-btn" onClick={checkIntegrity} style={{
            minWidth: 148, justifyContent: "center",
            color:       integrity === "ok" ? "var(--sage-500)" : undefined,
            borderColor: integrity === "ok" ? "rgba(107,122,79,0.4)" : undefined,
          }}>
            <IcLock size={13}/>
            {integrity === "checking" ? "Vérification…"
            : integrity === "ok"      ? "✓ Intégrité OK"
            :                           "Vérifier l'intégrité"}
          </button>
        }
      />

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Base de données locale</div>
          <div className="stg-card-s">
            Toutes vos transactions, catégories et règles vivent dans un fichier SQLite unique.
            Vous pouvez le déplacer, le sauvegarder, l'ouvrir avec un autre outil.
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
          <div style={{ padding: "12px 14px", background: "var(--cream-100)",
                        borderRadius: 10, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Taille
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink-900)", marginTop: 4 }}>
              4,8 Mo
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
              · 6 412 transactions
            </div>
          </div>
          <div style={{ padding: "12px 14px", background: "var(--cream-100)",
                        borderRadius: 10, border: "1px solid var(--line)" }}>
            <div style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Dernière sauvegarde
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--ink-900)", marginTop: 4 }}>
              il y a 2 j
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>
              12 mai · 22h04
            </div>
          </div>
          <div style={{ padding: "12px 14px", background: "rgba(107,122,79,0.10)",
                        borderRadius: 10, border: "1px solid rgba(107,122,79,0.25)" }}>
            <div style={{ fontSize: 10, color: "var(--sage-500)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Intégrité
            </div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, color: "var(--sage-500)", marginTop: 4 }}>
              ✓ OK
            </div>
            <div style={{ fontSize: 11, color: "var(--sage-500)", fontFamily: "var(--font-mono)" }}>
              checksum vérifié
            </div>
          </div>
        </div>

        <div className="stg-row">
          <div>
            <div className="stg-row-lbl">Emplacement</div>
            <div className="stg-row-sub">Le fichier reste accessible même si Ambre est désinstallée.</div>
          </div>
          <div className="stg-row-ctrl">
            <code style={{ fontSize: 12, color: "var(--ink-700)", background: "var(--cream-100)",
                          padding: "6px 10px", borderRadius: 6, fontFamily: "var(--font-mono)" }}>
              ~/.local/share/ambre/<strong style={{ color: "var(--amber-500)" }}>{dbPath}</strong>
            </code>
            <input ref={dbFileRef} type="file" accept=".db,.sqlite" style={{ display: "none" }}
                   onChange={e => { if (e.target.files[0]) setDbPath(e.target.files[0].name); }}/>
            <button className="stg-btn" onClick={() => dbFileRef.current?.click()}>Changer…</button>
          </div>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Sauvegarde automatique</div>
          <div className="stg-card-s">
            Une copie chiffrée est créée à intervalle régulier dans un dossier de votre choix.
          </div>
        </div>
        <div>
          <div className="stg-row">
            <div className="stg-row-lbl">Activer les sauvegardes auto.</div>
            <div className="stg-row-ctrl">
              <span className={"stg-tg" + (backupOn ? "" : " off")} onClick={() => setBackupOn(v => !v)}/>
            </div>
          </div>
          <div className="stg-row" style={{ opacity: backupOn ? 1 : 0.4, pointerEvents: backupOn ? "auto" : "none" }}>
            <div className="stg-row-lbl">Fréquence</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                {FREQ.map((f, i) => (
                  <button key={f} className={i === freq ? "active" : ""} onClick={() => setFreq(i)}>{f}</button>
                ))}
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
                {backupFolder}
              </code>
              <input ref={backupFolderRef} type="file" style={{ display: "none" }}
                     onChange={e => { if (e.target.files[0]) setBackupFolder("~/" + e.target.files[0].name.split("/").slice(0, -1).join("/") || "~/Documents/Ambre-backups/"); }}/>
              <button className="stg-btn" onClick={() => backupFolderRef.current?.click()}>Parcourir…</button>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="stg-btn amber" onClick={launchBackup}
                  disabled={backupRun === "running"}
                  style={{
                    minWidth: 220, justifyContent: "center",
                    background: backupRun === "done" ? "var(--sage-500)" : undefined,
                    borderColor: backupRun === "done" ? "var(--sage-500)" : undefined,
                    opacity: backupRun === "running" ? 0.7 : 1,
                  }}>
            <IcUpload size={13}/>
            {backupRun === "running" ? "Sauvegarde en cours…"
            : backupRun === "done"   ? "✓ Sauvegarde créée"
            :                          "Lancer une sauvegarde maintenant"}
          </button>
          <input ref={restoreRef} type="file" accept=".json,.sqlite,.db" style={{ display: "none" }}
                 onChange={e => {
                   if (e.target.files[0]) {
                     setRestoreMsg("✓ Fichier sélectionné : " + e.target.files[0].name);
                     setTimeout(() => setRestoreMsg(null), 3000);
                   }
                 }}/>
          <button className="stg-btn" onClick={() => restoreRef.current?.click()}
                  style={restoreMsg ? { color: "var(--sage-500)", borderColor: "rgba(107,122,79,0.4)" } : {}}>
            <IcImport size={13}/>{restoreMsg || "Restaurer depuis une sauvegarde"}
          </button>
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Exporter</div>
          <div className="stg-card-s">Sortir vos données dans un format ouvert.</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {[
            { fmt: ".csv",  desc: "Une ligne par transaction" },
            { fmt: ".json", desc: "Structure complète, règles incluses" },
            { fmt: ".ofx",  desc: "Compatible MoneyDance, GnuCash" },
            { fmt: ".pdf",  desc: "Rapport mensuel lisible" },
          ].map(f => {
            const done = exportDone === f.fmt;
            return (
              <button key={f.fmt} className="stg-btn" onClick={() => handleExport(f.fmt)} style={{
                padding: "10px 14px", flexDirection: "column", alignItems: "flex-start", gap: 2,
                borderColor: done ? "rgba(107,122,79,0.4)" : undefined,
              }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13,
                               color: done ? "var(--sage-500)" : "var(--amber-500)" }}>
                  {done ? "✓ exporté" : f.fmt}
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-500)" }}>{f.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="stg-card" style={{ border: "1px dashed rgba(168,90,72,0.3)" }}>
        <div>
          <div className="stg-card-t" style={{ color: "var(--rose-500)" }}>Zone sensible</div>
          <div className="stg-card-s">
            Ces actions sont irréversibles. Une sauvegarde est fortement recommandée au préalable.
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { key: "tx",  label: "Effacer les transactions importées" },
            { key: "cat", label: "Réinitialiser les catégories" },
            { key: "all", label: "Tout effacer (DB + parsers)", strong: true },
          ].map(({ key, label, strong }) => {
            const pending = danger === key;
            return (
              <button key={key} className="stg-btn danger" onClick={() => handleDanger(key)} style={{
                background: pending ? "rgba(168,90,72,0.15)" : strong ? "rgba(168,90,72,0.08)" : undefined,
                borderColor: pending ? "var(--rose-500)" : undefined,
                fontWeight: pending ? 500 : undefined,
              }}>
                {pending ? `⚠ Confirmer : ${label} ?` : label}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/* ─────────── 6. Apparence ─────────── */
function SettingsAppearance() {
  const THEMES  = [
    { id: "clair",  label: "Clair",   bg: "#faf6ef", panel: "#f6f1ea" },
    { id: "sombre", label: "Sombre",  bg: "#14110d", panel: "#1c1814" },
    { id: "auto",   label: "Système", bg: "linear-gradient(135deg, #faf6ef 50%, #14110d 50%)", panel: "#f6f1ea" },
  ];
  const ACCENTS = [
    { c: "#b8693d", l: "Ambre" },
    { c: "#a85a48", l: "Terracotta" },
    { c: "#6b7a4f", l: "Sauge" },
    { c: "#7a5c3a", l: "Bronze" },
    { c: "#3d2817", l: "Ink" },
  ];
  const TAILLES  = ["Compacte", "Normale", "Agréable"];
  const DENSITES = ["Compacte", "Confortable", "Spacieuse"];

  const [theme,   setTheme]   = useLocalStorage("stg.theme",   "clair");
  const [accent,  setAccent]  = useLocalStorage("stg.accent",  "Ambre");
  const [taille,  setTaille]  = useLocalStorage("stg.taille",  1);
  const [densite, setDensite] = useLocalStorage("stg.densite", 1);
  const [reduire, setReduire] = useLocalStorage("stg.reduire", false);

  return (
    <>
      <SubHeader
        breadcrumb="Apparence"
        title='Apparence et <em>confort</em>.'
        actions={null}
      />

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Thème</div>
          <div className="stg-card-s">Sombre ou clair, ou suit votre système.</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {THEMES.map(t => {
            const active = t.id === theme;
            return (
              <div key={t.id} onClick={() => setTheme(t.id)} style={{
                position: "relative", cursor: "pointer",
                border: active ? "2px solid var(--amber-500)" : "1px solid var(--line)",
                borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{ height: 100, background: t.bg, padding: 12,
                              display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ height: 18, background: t.panel, borderRadius: 4, width: "40%" }}/>
                  <div style={{ display: "flex", gap: 4 }}>
                    <div style={{ height: 28, flex: 1, background: t.panel, borderRadius: 4 }}/>
                    <div style={{ height: 28, flex: 1, background: t.panel, borderRadius: 4 }}/>
                  </div>
                  <div style={{ height: 22, background: t.panel, borderRadius: 4 }}/>
                </div>
                <div style={{ padding: "10px 14px", background: "var(--cream-50)",
                              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 500 }}>{t.label}</span>
                  {active && (
                    <span style={{
                      width: 14, height: 14, borderRadius: 999,
                      background: "var(--amber-500)", color: "var(--cream-50)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9
                    }}>✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Couleur d'accent</div>
          <div className="stg-card-s">Utilisée sur les CTA, les graphiques principaux et la sélection.</div>
        </div>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          {ACCENTS.map(s => {
            const active = s.l === accent;
            return (
              <div key={s.l} onClick={() => setAccent(s.l)}
                   style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, background: s.c,
                  border: active ? "3px solid var(--ink-800)" : "3px solid transparent",
                  boxShadow: active ? "0 0 0 2px var(--cream-50) inset" : "none"
                }}/>
                <span style={{ fontSize: 11, color: active ? "var(--ink-900)" : "var(--ink-700)", fontWeight: active ? 500 : 400 }}>{s.l}</span>
              </div>
            );
          })}
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            border: "2px dashed var(--line-strong)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--ink-500)", cursor: "pointer", marginLeft: 8
          }}>
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
              <span className="stg-select">
                <em style={{ fontFamily: "var(--font-display)" }}>Instrument Serif</em>
                <IcChevDn size={12}/>
              </span>
              <span style={{
                fontFamily: "var(--font-display)", fontStyle: "italic",
                fontSize: 22, color: "var(--amber-500)"
              }}>Ambre</span>
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
                {TAILLES.map((opt, i) => (
                  <button key={opt} className={i === taille ? "active" : ""} onClick={() => setTaille(i)}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div className="stg-row-lbl">Densité des tableaux</div>
            <div className="stg-row-ctrl">
              <div className="stg-segmented">
                {DENSITES.map((opt, i) => (
                  <button key={opt} className={i === densite ? "active" : ""} onClick={() => setDensite(i)}>{opt}</button>
                ))}
              </div>
            </div>
          </div>
          <div className="stg-row">
            <div>
              <div className="stg-row-lbl">Réduire les animations</div>
              <div className="stg-row-sub">Désactive les transitions des graphiques.</div>
            </div>
            <div className="stg-row-ctrl">
              <span className={"stg-tg" + (reduire ? "" : " off")} onClick={() => setReduire(v => !v)}/>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────── 7. À propos ─────────── */
function SettingsAbout() {
  return (
    <>
      <SubHeader
        breadcrumb="À propos"
        title="À <em>propos</em> d'Ambre."
        actions={null}
      />

      <div className="stg-card" style={{
        display: "grid", gridTemplateColumns: "auto 1fr auto",
        gap: 28, alignItems: "center"
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 18,
          background: "linear-gradient(140deg, #cd8459, #b8693d)",
          color: "var(--cream-50)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 44
        }}>a</div>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 34,
                        color: "var(--ink-900)", letterSpacing: "-0.01em" }}>Ambre</div>
          <div style={{ fontSize: 13, color: "var(--ink-600)", marginTop: 4 }}>
            Une application desktop pour comprendre où va son argent — sans cloud, sans compte, sans bruit.
          </div>
          <div style={{
            display: "flex", gap: 10, marginTop: 12,
            fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)"
          }}>
            <span>v0.4.2 <span style={{ background: "var(--cream-200)", padding: "1px 6px",
                                        borderRadius: 4, marginLeft: 4 }}>beta</span></span>
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
            { t: "Code source",          s: "github.com/projet-ambre/ambre · MIT",  ic: "{ }" },
            { t: "Signaler un problème", s: "Issue tracker public",                  ic: "!" },
            { t: "Communauté",           s: "Discussions, partage de parsers",       ic: "@" },
          ].map(r => (
            <div key={r.t} style={{
              display: "grid", gridTemplateColumns: "32px 1fr 16px",
              gap: 12, alignItems: "center",
              padding: "12px 14px", border: "1px solid var(--line)", borderRadius: 10,
              background: "var(--cream-100)", cursor: "pointer"
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: "var(--cream-50)", color: "var(--amber-500)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)", fontSize: 14
              }}>{r.ic}</div>
              <div>
                <div style={{ fontSize: 13, color: "var(--ink-900)", fontWeight: 500 }}>{r.t}</div>
                <div style={{ fontSize: 11, color: "var(--ink-500)" }}>{r.s}</div>
              </div>
              <span style={{ color: "var(--ink-500)", fontSize: 13 }}>→</span>
            </div>
          ))}
        </div>
      </div>

      <div className="stg-card">
        <div>
          <div className="stg-card-t">Dépendances open source</div>
          <div className="stg-card-s">Ambre n'existerait pas sans le travail de ces communautés.</div>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10,
          fontFamily: "var(--font-mono)", fontSize: 11.5
        }}>
          {[
            ["Tauri", "Apache 2.0"], ["React", "MIT"],
            ["SQLite", "Public domain"], ["Recharts", "MIT"],
            ["Lucide", "ISC"], ["pdfplumber", "MIT"],
            ["pdf-parse", "MIT"], ["date-fns", "MIT"],
          ].map(([n, l]) => (
            <div key={n} style={{
              padding: "8px 12px", background: "var(--cream-100)", borderRadius: 6,
              display: "flex", justifyContent: "space-between", color: "var(--ink-700)"
            }}>
              <span>{n}</span>
              <span style={{ color: "var(--ink-500)" }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        textAlign: "center", padding: "16px 0",
        fontSize: 12, color: "var(--ink-500)"
      }}>
        Conçu en France · <span style={{ color: "var(--rose-500)" }}>♡</span> · 2026
      </div>
    </>
  );
}

/* ─────────── Styles partagés ─────────── */
const STG_STYLES = `
  .stg-main { display: grid; grid-template-columns: 240px 1fr; gap: 20px;
              height: 100%; overflow: hidden;
              padding: 22px 28px 0;
              background: #efe7d6; color: var(--ink-800); font-size: 13px; }

  /* Sub-nav */
  .stg-sub { display: flex; flex-direction: column; gap: 4px; padding-top: 6px;
             overflow: auto; }
  .stg-sub-h { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em;
               text-transform: uppercase; padding: 0 12px 6px; }
  .stg-sub-title { font-family: var(--font-display); font-size: 24px;
                   color: var(--ink-900); margin: 4px 0 12px; padding: 0 12px;
                   letter-spacing: -0.01em; line-height: 1.1; }
  .stg-sub-item { display: flex; align-items: center; gap: 10px; padding: 9px 12px;
                  border-radius: 8px; color: var(--ink-700); font-size: 13px;
                  cursor: pointer; }
  .stg-sub-item:hover { background: var(--cream-50); }
  .stg-sub-item.active { background: var(--cream-50); color: var(--ink-900); font-weight: 500;
                         border-left: 2px solid var(--amber-500); padding-left: 10px; }
  .stg-sub-badge { margin-left: auto; background: var(--amber-500); color: var(--cream-50);
                   font-size: 10px; padding: 1px 6px; border-radius: 999px; }
  .stg-sub-foot { margin-top: auto; padding: 12px; font-size: 11px;
                  color: var(--ink-500); border-top: 1px solid var(--line);
                  display: flex; align-items: center; gap: 8px; }

  /* Content */
  .stg-content { display: flex; flex-direction: column; gap: 14px;
                 min-height: 0; overflow: auto; padding-bottom: 22px; }
  .stg-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 14px; }
  .stg-bread { font-size: 11px; color: var(--ink-500);
               letter-spacing: 0.06em; text-transform: uppercase; }
  .stg-bread strong { color: var(--ink-800); font-weight: 500;
                      letter-spacing: 0; text-transform: none; }
  .stg-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400;
            margin: 4px 0 0; color: var(--ink-900); letter-spacing: -0.01em; }
  .stg-h1 em { font-style: italic; color: var(--amber-500); }

  .stg-btn { display: inline-flex; align-items: center; gap: 6px;
             padding: 7px 12px; border: 1px solid var(--line); border-radius: 8px;
             background: var(--cream-50); color: var(--ink-700);
             font-size: 12px; cursor: pointer; }
  .stg-btn.amber { background: var(--amber-500); color: var(--cream-50);
                   border-color: var(--amber-500); font-weight: 500; }
  .stg-btn.danger { color: var(--rose-500); border-color: rgba(168,90,72,0.3); }

  .stg-card { background: var(--cream-50); border: 1px solid var(--line);
              border-radius: 14px; padding: 20px 24px;
              display: flex; flex-direction: column; gap: 16px; }
  .stg-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
  .stg-card-t { font-size: 14px; color: var(--ink-900); font-weight: 500; }
  .stg-card-s { font-size: 11.5px; color: var(--ink-500);
                margin-top: 3px; line-height: 1.5; max-width: 480px; }

  .stg-row { display: grid; grid-template-columns: 220px 1fr; gap: 24px;
             align-items: center; padding: 12px 0;
             border-bottom: 1px dashed var(--line); }
  .stg-row:last-child { border-bottom: none; }
  .stg-row-lbl { font-size: 13px; color: var(--ink-800); }
  .stg-row-sub { font-size: 11px; color: var(--ink-500); margin-top: 2px; line-height: 1.4; }
  .stg-row-ctrl { display: flex; align-items: center; gap: 10px; }

  .stg-input { background: var(--cream-100); border: 1px solid var(--line);
               border-radius: 8px; padding: 7px 12px;
               font-size: 13px; color: var(--ink-800);
               font-family: inherit; min-width: 220px; outline: none; }
  .stg-input:focus { border-color: var(--amber-500); }
  .stg-select { display: inline-flex; align-items: center; gap: 8px;
                padding: 7px 12px; background: var(--cream-100);
                border: 1px solid var(--line); border-radius: 8px;
                font-size: 13px; color: var(--ink-800);
                min-width: 220px; justify-content: space-between; cursor: pointer; }

  .stg-tg { width: 36px; height: 20px; background: var(--sage-500);
            border-radius: 999px; position: relative; cursor: pointer; flex-shrink: 0; }
  .stg-tg::after { content: ""; position: absolute; right: 2px; top: 2px;
                   width: 16px; height: 16px; border-radius: 50%; background: var(--cream-50); }
  .stg-tg.off { background: var(--cream-200); }
  .stg-tg.off::after { right: auto; left: 2px; }

  .stg-tg-mini { width: 32px; height: 18px; background: var(--sage-500);
                 border-radius: 999px; position: relative;
                 cursor: pointer; flex-shrink: 0; }
  .stg-tg-mini::after { content: ""; position: absolute; right: 2px; top: 2px;
                        width: 14px; height: 14px; border-radius: 50%; background: var(--cream-50); }
  .stg-tg-mini.off { background: var(--cream-200); }
  .stg-tg-mini.off::after { right: auto; left: 2px; }

  .stg-segmented { display: inline-flex; padding: 3px;
                   background: var(--cream-100); border: 1px solid var(--line);
                   border-radius: 8px; gap: 2px; }
  .stg-segmented button { padding: 5px 12px; border-radius: 6px;
                          font-size: 12px; color: var(--ink-600);
                          background: transparent; border: none; cursor: pointer; }
  .stg-segmented button.active { background: var(--cream-50); color: var(--ink-800);
                                 font-weight: 500; border: 1px solid var(--line); }

  /* Alerts-specific */
  .stg-channels { background: var(--cream-50); border: 1px solid var(--line);
                  border-radius: 14px; padding: 18px 22px;
                  display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
  .stg-channel { display: flex; flex-direction: column; gap: 6px; }
  .stg-channel-h { display: flex; align-items: center; gap: 8px;
                   font-size: 11px; color: var(--ink-500);
                   letter-spacing: 0.08em; text-transform: uppercase; }
  .stg-channel-l { font-size: 13px; color: var(--ink-800); }
  .stg-channel-d { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

  .stg-alerts-card { background: var(--cream-50); border: 1px solid var(--line);
                     border-radius: 14px;
                     display: flex; flex-direction: column; overflow: hidden; }
  .stg-alert { display: grid; grid-template-columns: 36px 1fr 130px 110px 36px 28px 28px;
               align-items: center; gap: 12px;
               padding: 12px 22px; border-bottom: 1px dashed var(--line); }
  .stg-alert:last-child { border-bottom: none; }
  .stg-alert-ico { width: 36px; height: 36px; border-radius: 9px;
                   display: flex; align-items: center; justify-content: center;
                   color: var(--cream-50); }
  .stg-alert-name { font-size: 13px; color: var(--ink-800); font-weight: 500; }
  .stg-alert-cond { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
  .stg-alert-thr { font-family: var(--font-mono); font-size: 11px;
                   color: var(--ink-700); text-align: right; }
  .stg-alert-state { display: inline-flex; align-items: center; gap: 6px;
                     font-family: var(--font-mono); font-size: 11px;
                     padding: 3px 9px; border-radius: 999px; }
  .stg-alert-state.warn { background: rgba(184,105,61,0.10); color: var(--amber-500); }
  .stg-alert-state.ok   { background: var(--cream-200); color: var(--ink-600); }

  .stg-tpl-grid { padding: 12px 22px 18px;
                  display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  .stg-tpl { padding: 12px 14px; border: 1px dashed var(--line-strong);
             border-radius: 10px; display: flex; flex-direction: column; gap: 6px;
             cursor: pointer; background: var(--cream-100); }
  .stg-tpl:hover { border-color: var(--amber-500); }
  .stg-tpl-h { display: flex; align-items: center; justify-content: space-between; }
  .stg-tpl-ico { width: 28px; height: 28px; border-radius: 7px;
                 background: var(--cream-50);
                 display: flex; align-items: center; justify-content: center;
                 font-family: var(--font-display); font-style: italic;
                 font-size: 15px; color: var(--amber-500); }
  .stg-tpl-t { font-size: 12.5px; color: var(--ink-900); font-weight: 500; }
  .stg-tpl-d { font-size: 11px; color: var(--ink-500); }
`;
