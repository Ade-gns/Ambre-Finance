/* Modal "Définir un budget" — overlay sur le Dashboard
   1440 × 900. Dashboard en arrière-plan flouté, modal au centre. */

function ScreenBudgetModal() {
  const cat = { id: "loi", label: "Loisirs", color: "#a85a48",
                desc: "Sorties, cinéma, livres, concerts, jeux" };

  return (
    <div style={{ width: 1440, height: 900, position: "relative", overflow: "hidden" }}>
      {/* Background Dashboard */}
      <DashAtelierClair/>

      {/* Overlay */}
      <div style={{
        position: "absolute", inset: 0,
        background: "rgba(42,28,16,0.42)",
        backdropFilter: "blur(2px)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2
      }}>
        {/* MODAL */}
        <div style={{
          width: 540, background: "var(--cream-50)",
          borderRadius: 16, padding: 0,
          boxShadow: "0 20px 60px rgba(42,28,16,0.30), 0 0 0 1px rgba(61,40,23,0.10)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          fontFamily: "var(--font-ui)"
        }}>
          {/* Header */}
          <div style={{ padding: "22px 28px 16px", borderBottom: "1px solid var(--line)",
                        display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 11, background: cat.color, color: "var(--cream-50)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22 }}>l</div>
              <div>
                <div style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Définir un budget mensuel
                </div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--ink-900)",
                              letterSpacing: "-0.01em", marginTop: 2 }}>
                  Catégorie <em style={{ color: cat.color, fontStyle: "italic" }}>{cat.label}</em>
                </div>
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>{cat.desc}</div>
              </div>
            </div>
            <button style={{ width: 32, height: 32, padding: 0, background: "transparent",
                             border: "1px solid var(--line)", borderRadius: 8, color: "var(--ink-500)",
                             display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "20px 28px 4px", display: "flex", flexDirection: "column", gap: 22 }}>
            {/* Big amount input */}
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.08em",
                            textTransform: "uppercase", marginBottom: 8 }}>
                Montant mensuel
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10,
                            background: "var(--cream-100)", border: "1.5px solid var(--amber-500)",
                            borderRadius: 12, padding: "16px 22px" }}>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 40, color: "var(--ink-500)" }}>€</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: 56, color: "var(--ink-900)",
                               lineHeight: 1, letterSpacing: "-0.02em" }}>100</span>
                <span style={{ flex: 1 }}/>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-end" }}>
                  <span style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em",
                                 textTransform: "uppercase" }}>Période</span>
                  <span style={{ fontSize: 13, color: "var(--ink-800)", fontWeight: 500,
                                 display: "inline-flex", alignItems: "center", gap: 6 }}>
                    par mois <IcChevDn size={12}/>
                  </span>
                </div>
              </div>
              {/* Suggestions */}
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <span style={{ fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.08em",
                               textTransform: "uppercase", alignSelf: "center", marginRight: 4 }}>
                  Suggestions
                </span>
                {[
                  { v: "80 €", note: "min sur 6 mois" },
                  { v: "100 €", note: "actuel", active: true },
                  { v: "120 €", note: "moyenne" },
                  { v: "150 €", note: "max" },
                ].map(s => (
                  <button key={s.v} style={{
                    padding: "5px 10px", borderRadius: 7,
                    background: s.active ? "var(--amber-100)" : "var(--cream-50)",
                    border: "1px solid " + (s.active ? "rgba(184,105,61,0.3)" : "var(--line)"),
                    fontSize: 11.5, color: s.active ? "var(--amber-500)" : "var(--ink-700)",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1,
                    fontFamily: "inherit", cursor: "pointer"
                  }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{s.v}</span>
                    <span style={{ fontSize: 9, color: "var(--ink-500)" }}>{s.note}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current status preview */}
            <div style={{ padding: "12px 16px", background: "var(--cream-100)",
                          border: "1px dashed var(--line-strong)", borderRadius: 10,
                          display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 11, color: "var(--ink-500)" }}>Ce mois</div>
              <div style={{ flex: 1, position: "relative", height: 8, background: "rgba(61,40,23,0.06)",
                            borderRadius: 999 }}>
                <div style={{ width: "96.8%", height: "100%", background: cat.color, borderRadius: 999 }}/>
                <div style={{ position: "absolute", left: "calc(96.8% - 1px)", top: -4, bottom: -4,
                              width: 2, background: "var(--ink-800)" }}/>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 1 }}>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--ink-900)" }}>
                  96,80 / 100 €
                </span>
                <span style={{ fontSize: 10, color: cat.color, fontFamily: "var(--font-mono)" }}>
                  97 % · seuil bientôt atteint
                </span>
              </div>
            </div>

            {/* Thresholds */}
            <div>
              <div style={{ fontSize: 11, color: "var(--ink-500)", letterSpacing: "0.08em",
                            textTransform: "uppercase", marginBottom: 8 }}>
                Seuils d'alerte
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[
                  { pct: 50, label: "Premier rappel", on: false },
                  { pct: 85, label: "Avertissement",   on: true },
                  { pct: 100, label: "Dépassement",    on: true },
                ].map(t => (
                  <div key={t.pct} style={{
                    flex: 1, padding: "10px 12px",
                    background: t.on ? "var(--amber-100)" : "var(--cream-100)",
                    border: "1px solid " + (t.on ? "rgba(184,105,61,0.3)" : "var(--line)"),
                    borderRadius: 9
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--font-display)", fontSize: 22,
                                     color: t.on ? "var(--amber-500)" : "var(--ink-500)" }}>{t.pct} %</span>
                      <span style={{ width: 28, height: 16, background: t.on ? "var(--sage-500)" : "var(--cream-200)",
                                     borderRadius: 999, position: "relative" }}>
                        <span style={{ position: "absolute", top: 2, [t.on ? "right" : "left"]: 2,
                                       width: 12, height: 12, borderRadius: 50, background: "var(--cream-50)" }}/>
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--ink-600)", marginTop: 2 }}>{t.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Apply to similar */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0",
                          borderTop: "1px dashed var(--line)" }}>
              <span style={{ width: 16, height: 16, borderRadius: 4, border: "1.5px solid var(--line-strong)",
                             background: "var(--amber-500)", borderColor: "var(--amber-500)",
                             display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="white"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l3 3 5-6"/></svg>
              </span>
              <div style={{ flex: 1, fontSize: 12.5, color: "var(--ink-800)" }}>
                Reconduire automatiquement chaque mois
                <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2 }}>
                  Le budget se renouvelle au 1er du mois. Vous pouvez le modifier à tout moment.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "16px 28px", background: "var(--cream-100)",
                        borderTop: "1px solid var(--line)",
                        display: "flex", justify: "space-between", alignItems: "center",
                        justifyContent: "space-between", gap: 10 }}>
            <button style={{ fontSize: 11, color: "var(--rose-500)", background: "transparent",
                             border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
              Supprimer ce budget
            </button>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "9px 16px", border: "1px solid var(--line)",
                               background: "var(--cream-50)", color: "var(--ink-700)", borderRadius: 9,
                               fontSize: 13, fontFamily: "inherit", cursor: "pointer" }}>
                Annuler
              </button>
              <button style={{ padding: "9px 18px", border: "1px solid var(--amber-500)",
                               background: "var(--amber-500)", color: "var(--cream-50)",
                               borderRadius: 9, fontSize: 13, fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Enregistrer le budget
              </button>
            </div>
          </div>

          {/* Keyboard hint */}
          <div style={{ padding: "8px 28px 12px", background: "var(--cream-100)",
                        fontSize: 10, color: "var(--ink-500)", display: "flex", gap: 12,
                        fontFamily: "var(--font-mono)" }}>
            <span><kbd style={{ background: "var(--cream-50)", border: "1px solid var(--line)",
                                 padding: "1px 5px", borderRadius: 3 }}>Esc</kbd> annuler</span>
            <span><kbd style={{ background: "var(--cream-50)", border: "1px solid var(--line)",
                                 padding: "1px 5px", borderRadius: 3 }}>⏎</kbd> enregistrer</span>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ScreenBudgetModal = ScreenBudgetModal;
