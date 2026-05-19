/* Recherche globale ⌘K — palette de commandes
   1440 × 900. Transactions en arrière-plan, modal centré-haut avec input et résultats groupés. */

function ScreenCommandPalette() {
  return (
    <div style={{ width: 1440, height: 900, position: "relative", overflow: "hidden" }}>
      {/* Background */}
      <ScreenTransactions/>

      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(42,28,16,0.45)",
        backdropFilter: "blur(3px)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 130, zIndex: 2
      }}>
        <CommandPalette/>
        <div style={{ marginTop: 20, fontSize: 11, color: "var(--cream-200)", fontFamily: "var(--font-mono)",
                      display: "flex", gap: 20 }}>
          <span><kbd style={cmdKbd}>↑</kbd><kbd style={cmdKbd}>↓</kbd> naviguer</span>
          <span><kbd style={cmdKbd}>⏎</kbd> ouvrir</span>
          <span><kbd style={cmdKbd}>Tab</kbd> filtrer par groupe</span>
          <span><kbd style={cmdKbd}>Esc</kbd> fermer</span>
        </div>
      </div>
    </div>
  );
}

const cmdKbd = {
  background: "rgba(232,224,208,0.10)",
  border: "1px solid rgba(232,224,208,0.20)",
  padding: "1px 6px", borderRadius: 4, marginRight: 4
};

function CommandPalette() {
  const groups = [
    {
      label: "Récents",
      items: [
        { icon: <IcList size={14}/>, kind: "tx",    label: "Carrefour Market", sub: "14 mai · −52,34 €", kbd: "↩" },
        { icon: <IcTag size={14}/>,  kind: "cat",   label: "Alimentation",     sub: "catégorie · 487 € ce mois" },
        { icon: <IcImport size={14}/>, kind: "act", label: "Importer un relevé", sub: "action rapide", kbd: "⌘I" },
      ]
    },
    {
      label: "Naviguer",
      items: [
        { icon: <IcHome size={14}/>,    kind: "nav", label: "Tableau de bord",     sub: "Aller à · accueil", kbd: "G T" },
        { icon: <IcList size={14}/>,    kind: "nav", label: "Toutes les transactions", sub: "Aller à · journal complet", kbd: "G X", active: true },
        { icon: <IcTag size={14}/>,     kind: "nav", label: "Catégories",          sub: "Aller à · 9 catégories", kbd: "G C" },
        { icon: <IcChart size={14}/>,   kind: "nav", label: "Évolution mensuelle", sub: "Aller à · 12 derniers mois", kbd: "G E" },
        { icon: <IcBell size={14}/>,    kind: "nav", label: "Alertes",             sub: "2 en attente", kbd: "G A", badge: 2 },
        { icon: <IcSettings size={14}/>, kind: "nav", label: "Paramètres",         sub: "Aller à · préférences", kbd: "⌘," },
      ]
    },
    {
      label: "Actions",
      items: [
        { icon: <IcUpload size={14}/>, kind: "act", label: "Importer un relevé bancaire", sub: "PDF, CSV, OFX, QIF", kbd: "⌘I" },
        { icon: <IcPlus size={14}/>,   kind: "act", label: "Ajouter une transaction manuelle", sub: "Ouvrir le formulaire", kbd: "⌘N" },
        { icon: <IcTag size={14}/>,    kind: "act", label: "Créer une catégorie",   sub: "Nouvelle catégorie · règle optionnelle" },
        { icon: <IcCalendar size={14}/>, kind: "act", label: "Définir un budget pour Loisirs", sub: "97 % atteint ce mois" },
        { icon: <IcLock size={14}/>,   kind: "act", label: "Exporter mes données", sub: "JSON ou CSV chiffré" },
      ]
    },
    {
      label: "Transactions",
      items: [
        { icon: <span style={{ width: 14, height: 14, borderRadius: 999, background: "#6b7a4f", display: "inline-block" }}/>, kind: "tx",
          label: "SNCF — Paris ↔ Lyon", sub: "11 mai · Transports · −67,00 €" },
        { icon: <span style={{ width: 14, height: 14, borderRadius: 999, background: "#a85a48", display: "inline-block" }}/>, kind: "tx",
          label: "Le Petit Café", sub: "08 mai · Loisirs · −14,20 €" },
      ]
    },
    {
      label: "Paramètres",
      items: [
        { icon: <IcSun size={14}/>,  kind: "set", label: "Changer le thème en sombre", sub: "Apparence" },
        { icon: <IcLock size={14}/>, kind: "set", label: "Activer le verrouillage au démarrage", sub: "Sécurité" },
      ]
    }
  ];

  return (
    <div style={{
      width: 720, background: "var(--cream-50)",
      borderRadius: 14,
      boxShadow: "0 24px 60px rgba(42,28,16,0.42), 0 0 0 1px rgba(61,40,23,0.10)",
      overflow: "hidden", maxHeight: 620, display: "flex", flexDirection: "column",
      fontFamily: "var(--font-ui)"
    }}>
      {/* Search input */}
      <div style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
        <IcSearch size={18} style={{ color: "var(--ink-500)" }}/>
        <input
          placeholder="Rechercher une transaction, une catégorie, ou tapez une commande…"
          readOnly value="trans"
          style={{ flex: 1, border: "none", outline: "none", background: "transparent",
                   fontFamily: "inherit", fontSize: 16, color: "var(--ink-900)" }}/>
        <span style={{ fontSize: 10, color: "var(--ink-500)", fontFamily: "var(--font-mono)",
                      background: "var(--cream-100)", padding: "2px 7px", borderRadius: 5,
                      border: "1px solid var(--line)" }}>
          ⌘K
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 4, padding: "8px 16px",
                    background: "var(--cream-100)", borderBottom: "1px solid var(--line)",
                    fontSize: 11 }}>
        {[
          { l: "Tout", n: 18, active: true },
          { l: "Navigation", n: 6 },
          { l: "Actions", n: 5 },
          { l: "Transactions", n: 2 },
          { l: "Paramètres", n: 2 },
        ].map(f => (
          <button key={f.l} style={{
            padding: "5px 11px", borderRadius: 6,
            background: f.active ? "var(--amber-100)" : "transparent",
            color: f.active ? "var(--amber-500)" : "var(--ink-600)",
            border: f.active ? "1px solid rgba(184,105,61,0.3)" : "1px solid transparent",
            fontSize: 11.5, cursor: "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", gap: 6
          }}>
            {f.l}
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, opacity: 0.7 }}>{f.n}</span>
          </button>
        ))}
      </div>

      {/* Results */}
      <div style={{ overflow: "auto", flex: 1 }}>
        {groups.map(g => (
          <div key={g.label}>
            <div style={{ padding: "10px 20px 6px", fontSize: 10,
                          color: "var(--ink-500)", letterSpacing: "0.1em", textTransform: "uppercase",
                          fontFamily: "var(--font-mono)" }}>
              {g.label}
            </div>
            {g.items.map((it, i) => (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "28px 1fr auto auto", gap: 12,
                alignItems: "center", padding: "10px 20px",
                background: it.active ? "var(--amber-100)" : "transparent",
                borderLeft: it.active ? "2px solid var(--amber-500)" : "2px solid transparent",
                paddingLeft: it.active ? 18 : 20, cursor: "pointer", position: "relative"
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 7,
                              background: it.active ? "var(--cream-50)" : "var(--cream-100)",
                              color: it.active ? "var(--amber-500)" : "var(--ink-600)",
                              display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {it.icon}
                </div>
                <div>
                  <div style={{ fontSize: 13, color: "var(--ink-900)",
                                fontWeight: it.active ? 500 : 400 }}>
                    {it.label}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 1 }}>{it.sub}</div>
                </div>
                {it.badge && (
                  <span style={{ background: "var(--rose-500)", color: "var(--cream-50)",
                                 fontSize: 10, padding: "1px 6px", borderRadius: 999 }}>{it.badge}</span>
                )}
                {it.kbd && (
                  <span style={{ fontSize: 10, color: "var(--ink-500)",
                                 fontFamily: "var(--font-mono)",
                                 background: "var(--cream-100)", padding: "2px 7px",
                                 borderRadius: 4, border: "1px solid var(--line)" }}>
                    {it.kbd}
                  </span>
                )}
                {!it.kbd && !it.badge && (
                  <span style={{ color: "var(--ink-400)" }}><IcArrowR size={12}/></span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom info */}
      <div style={{ padding: "10px 20px", borderTop: "1px solid var(--line)",
                    background: "var(--cream-100)",
                    fontSize: 10.5, color: "var(--ink-500)",
                    display: "flex", alignItems: "center", gap: 14, fontFamily: "var(--font-mono)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-500)" }}/>
          Recherche locale · vos requêtes ne sont jamais envoyées
        </span>
        <span style={{ marginLeft: "auto" }}>18 résultats en 4 ms</span>
      </div>
    </div>
  );
}

window.ScreenCommandPalette = ScreenCommandPalette;
