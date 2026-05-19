/* Écran — Onboarding (premier lancement)
   1440 × 900. Hero éditorial gauche + zone d'import direct droite.
   Pas de sidebar (l'app n'est pas encore initialisée). */

function ScreenOnboarding() {
  return (
    <div className="ob-root">
      <style>{`
        .ob-root { width: 1440px; height: 900px; background: var(--cream-100); color: var(--ink-800);
                   display: grid; grid-template-columns: 1.05fr 0.95fr; overflow: hidden; }

        /* LEFT — manifesto */
        .ob-left { padding: 56px 64px; background: var(--cream-50);
                   display: flex; flex-direction: column; justify-content: space-between;
                   position: relative; }
        .ob-left::before { content: ""; position: absolute; inset: 0; opacity: 0.5;
                           background-image: radial-gradient(circle at 80% 20%, rgba(184,105,61,0.10), transparent 60%); }
        .ob-left > * { position: relative; z-index: 1; }
        .ob-logo { display: flex; align-items: center; gap: 12px; }
        .ob-logo-mark { width: 44px; height: 44px; border-radius: 12px;
                        background: linear-gradient(140deg, #cd8459, #b8693d); color: var(--cream-50);
                        display: flex; align-items: center; justify-content: center;
                        font-family: var(--font-display); font-style: italic; font-size: 26px; }
        .ob-logo-n { font-family: var(--font-display); font-size: 22px; color: var(--ink-900); letter-spacing: -0.01em; }
        .ob-logo-s { font-size: 11px; color: var(--ink-500); letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }

        .ob-h1 { font-family: var(--font-display); font-size: 64px; line-height: 1.05; color: var(--ink-900);
                 letter-spacing: -0.02em; margin: 0; font-weight: 400; max-width: 600px; }
        .ob-h1 em { font-style: italic; color: var(--amber-500); }
        .ob-sub { font-size: 16px; color: var(--ink-600); margin-top: 20px; max-width: 500px; line-height: 1.6; }
        .ob-sub strong { color: var(--ink-800); font-weight: 500; }

        .ob-principles { display: flex; flex-direction: column; gap: 18px; max-width: 540px; }
        .ob-prn { display: flex; gap: 14px; align-items: flex-start; }
        .ob-prn-ico { width: 36px; height: 36px; border-radius: 10px;
                      background: var(--amber-100); color: var(--amber-500);
                      display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ob-prn-t { font-size: 14px; color: var(--ink-900); font-weight: 500; }
        .ob-prn-d { font-size: 12.5px; color: var(--ink-600); margin-top: 3px; line-height: 1.5; }

        .ob-meta { display: flex; align-items: center; gap: 10px; font-size: 11px; color: var(--ink-500); }
        .ob-meta .dot { color: var(--sage-500); }

        /* RIGHT — import setup */
        .ob-right { padding: 56px; background: var(--cream-100);
                    display: flex; flex-direction: column; gap: 22px; justify-content: center; }
        .ob-step { display: flex; align-items: center; gap: 12px; font-size: 11px;
                   color: var(--ink-500); letter-spacing: 0.1em; text-transform: uppercase; }
        .ob-step .dots { display: flex; gap: 5px; }
        .ob-step .dots > span { width: 6px; height: 6px; border-radius: 999px; background: var(--cream-300); }
        .ob-step .dots > span.active { background: var(--amber-500); width: 18px; border-radius: 4px; }

        .ob-r-h { font-family: var(--font-display); font-size: 30px; color: var(--ink-900); letter-spacing: -0.01em; margin: 0; font-weight: 400; }
        .ob-r-h em { font-style: italic; color: var(--amber-500); }
        .ob-r-s { font-size: 13px; color: var(--ink-600); line-height: 1.5; }

        .ob-drop { background: var(--cream-50); border: 1.5px dashed rgba(184,105,61,0.5);
                   border-radius: 16px; padding: 36px 28px; display: flex; flex-direction: column;
                   align-items: center; gap: 12px; }
        .ob-drop-ico { width: 56px; height: 56px; border-radius: 14px; background: var(--amber-100);
                       color: var(--amber-500); display: flex; align-items: center; justify-content: center; }
        .ob-drop-t { font-family: var(--font-display); font-size: 22px; color: var(--ink-900); }
        .ob-drop-s { font-size: 12px; color: var(--ink-600); text-align: center; max-width: 360px; }
        .ob-drop-btn { display: inline-flex; align-items: center; gap: 8px; padding: 11px 18px;
                       background: var(--amber-500); color: var(--cream-50); border: none;
                       border-radius: 9px; font-size: 13px; font-weight: 500; margin-top: 4px; }
        .ob-drop-fmt { display: flex; gap: 6px; }
        .ob-drop-fmt > span { font-family: var(--font-mono); font-size: 10px;
                              padding: 2px 8px; background: var(--cream-200); color: var(--ink-700); border-radius: 999px; }

        .ob-alt { display: flex; align-items: center; gap: 10px; padding: 14px 16px;
                  background: var(--cream-50); border: 1px solid var(--line); border-radius: 10px; }
        .ob-alt-ico { width: 30px; height: 30px; border-radius: 8px; background: var(--cream-200);
                      color: var(--ink-700); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .ob-alt-t { font-size: 13px; color: var(--ink-800); }
        .ob-alt-s { font-size: 11px; color: var(--ink-500); margin-top: 1px; }
        .ob-alt-cta { font-size: 12px; color: var(--amber-500); font-weight: 500; cursor: pointer; }

        .ob-foot { display: flex; align-items: center; justify-content: space-between;
                   margin-top: 6px; font-size: 12px; color: var(--ink-500); }
        .ob-foot a { color: var(--ink-700); cursor: pointer; }
      `}</style>

      {/* LEFT */}
      <div className="ob-left">
        <div className="ob-logo">
          <div className="ob-logo-mark">a</div>
          <div>
            <div className="ob-logo-n">Ambre</div>
            <div className="ob-logo-s">Finance personnelle · v0.4.2</div>
          </div>
        </div>

        <div>
          <h1 className="ob-h1">Vos finances,<br/>au calme. <em>Ici.</em></h1>
          <p className="ob-sub">
            Ambre lit vos relevés bancaires localement, en extrait les transactions et
            les classe en quelques secondes. <strong>Aucun cloud, aucun compte, aucune connexion.</strong>
            Vos données ne quittent jamais votre appareil.
          </p>
        </div>

        <div className="ob-principles">
          <div className="ob-prn">
            <div className="ob-prn-ico"><IcLock size={18}/></div>
            <div>
              <div className="ob-prn-t">Local par défaut.</div>
              <div className="ob-prn-d">Tout est stocké dans une base SQLite sur votre disque. Vous pouvez l'ouvrir, la sauvegarder, l'effacer quand vous voulez.</div>
            </div>
          </div>
          <div className="ob-prn">
            <div className="ob-prn-ico"><IcTag size={18}/></div>
            <div>
              <div className="ob-prn-t">Classement intelligent, modifiable.</div>
              <div className="ob-prn-d">Les transactions sont pré-rangées par catégorie. Les règles que vous créez s'appliquent automatiquement aux futurs relevés.</div>
            </div>
          </div>
          <div className="ob-prn">
            <div className="ob-prn-ico"><IcChart size={18}/></div>
            <div>
              <div className="ob-prn-t">Lecture immédiate.</div>
              <div className="ob-prn-d">Combien j'ai dépensé, dans quoi, comment ça évolue — sans clic supplémentaire.</div>
            </div>
          </div>
        </div>

        <div className="ob-meta">
          <span className="dot">●</span>
          Open source · MIT · vos données restent ici · aucune télémétrie
        </div>
      </div>

      {/* RIGHT */}
      <div className="ob-right">
        <div className="ob-step">
          <span>Étape 1 sur 4</span>
          <div className="dots">
            <span className="active"/>
            <span/><span/><span/>
          </div>
        </div>

        <div>
          <h2 className="ob-r-h">Importez votre premier <em>relevé</em>.</h2>
          <p className="ob-r-s" style={{ marginTop: 10 }}>
            Glissez un PDF de votre banque ou un export CSV. Ambre détectera le format
            et vous montrera un aperçu avant d'enregistrer quoi que ce soit.
          </p>
        </div>

        <div className="ob-drop">
          <div className="ob-drop-ico">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4h6l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
              <path d="M15 4v5h5"/>
              <path d="M12 19v-8M8 15l4-4 4 4"/>
            </svg>
          </div>
          <div className="ob-drop-t">Glissez un relevé ici</div>
          <div className="ob-drop-s">PDF, CSV, OFX ou QIF — la plupart des banques françaises sont reconnues.</div>
          <button className="ob-drop-btn"><IcUpload size={14}/>Parcourir mes fichiers</button>
          <div className="ob-drop-fmt">
            <span>.pdf</span><span>.csv</span><span>.ofx</span><span>.qif</span>
          </div>
        </div>

        <div className="ob-alt">
          <div className="ob-alt-ico"><IcTag size={15}/></div>
          <div style={{ flex: 1 }}>
            <div className="ob-alt-t">Pas de relevé sous la main ?</div>
            <div className="ob-alt-s">Démarrez avec un jeu de données d'exemple — 3 mois fictifs, 142 transactions.</div>
          </div>
          <span className="ob-alt-cta">Charger l'exemple →</span>
        </div>

        <div className="ob-foot">
          <a>← Configurer plus tard</a>
          <span>↩ Entrée pour continuer</span>
        </div>
      </div>
    </div>
  );
}

window.ScreenOnboarding = ScreenOnboarding;
