import { IcArrowR, IcImport } from "../../lib/icons";

/* ─────────────────────────────────────────────────────────────────
   4. Erreur — message principal + détails + cas fréquents
   ───────────────────────────────────────────────────────────────── */
export default function ImportError({ onRetry, errorMsg, fileName }) {
  const name = fileName || "fichier-inconnu";

  return (
    <main className="ier-main">
      <style>{`
        .ier-main { padding: 22px 28px; display: flex; flex-direction: column;
                    gap: 16px; height: 100%; overflow: auto;
                    background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
        .ier-bread { font-size: 11px; color: var(--ink-500);
                     letter-spacing: 0.06em; text-transform: uppercase;
                     display: flex; align-items: center; gap: 6px; }
        .ier-bread .err { color: var(--rose-500); font-weight: 500;
                          letter-spacing: 0; text-transform: none; }

        .ier-hero { background: var(--cream-50); border: 1px solid var(--line);
                    border-radius: 16px; padding: 40px 44px;
                    display: grid; grid-template-columns: 80px 1fr 220px;
                    gap: 28px; align-items: flex-start;
                    position: relative; overflow: hidden; }
        .ier-hero::before { content: ""; position: absolute; inset: 0;
                            background-image: radial-gradient(circle at 80% 50%, rgba(168,90,72,0.08), transparent 60%); }
        .ier-hero > * { position: relative; z-index: 1; }
        .ier-mark { width: 64px; height: 64px; border-radius: 16px;
                    background: rgba(168,90,72,0.10); color: var(--rose-500);
                    display: flex; align-items: center; justify-content: center; }
        .ier-l { font-size: 11px; color: var(--rose-500);
                 letter-spacing: 0.1em; text-transform: uppercase;
                 display: flex; align-items: center; gap: 8px; }
        .ier-l .dot { width: 6px; height: 6px; border-radius: 999px; background: var(--rose-500); }
        .ier-h { font-family: var(--font-display); font-size: 36px; line-height: 1.1;
                 color: var(--ink-900); letter-spacing: -0.02em;
                 margin: 8px 0 6px; font-weight: 400; }
        .ier-h em { font-style: italic; color: var(--rose-500); }
        .ier-s { font-size: 13.5px; color: var(--ink-600); line-height: 1.55; max-width: 600px; }
        .ier-meta { display: flex; gap: 14px; margin-top: 12px;
                    font-size: 11px; color: var(--ink-500); }
        .ier-meta strong { color: var(--ink-800); font-family: var(--font-mono); font-weight: 500; }
        .ier-actions { display: flex; flex-direction: column; gap: 8px; }
        .ier-btn { display: inline-flex; align-items: center; gap: 8px;
                   padding: 9px 14px; border: 1px solid var(--line);
                   border-radius: 9px; background: var(--cream-50);
                   color: var(--ink-700); font-size: 12.5px;
                   cursor: pointer; }
        .ier-btn.amber { background: var(--amber-500); color: var(--cream-50);
                         border-color: var(--amber-500); font-weight: 500; }
        .ier-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        .ier-tips { background: var(--cream-50); border: 1px solid var(--line);
                    border-radius: 14px; padding: 20px 24px; }
        .ier-tips-h { font-size: 12px; color: var(--ink-800); font-weight: 500; margin-bottom: 14px; }
        .ier-tip { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px;
                   font-size: 12.5px; color: var(--ink-700); }
        .ier-tip:last-child { margin-bottom: 0; }
        .ier-tip .num { width: 22px; height: 22px; border-radius: 6px;
                        background: var(--cream-200); color: var(--ink-700);
                        display: flex; align-items: center; justify-content: center;
                        font-family: var(--font-mono); font-size: 11px;
                        font-weight: 500; flex-shrink: 0; }
        .ier-errbox { font-family: var(--font-mono); font-size: 12px; color: var(--rose-500);
                      background: rgba(168,90,72,0.08); border-left: 3px solid var(--rose-500);
                      padding: 12px 16px; border-radius: 0 8px 8px 0; margin-top: 12px;
                      line-height: 1.5; }

        @media (max-width: 768px) {
          .ier-main { padding: 14px 12px; }
          .ier-hero { grid-template-columns: 1fr; padding: 24px 20px; gap: 14px; }
          .ier-h { font-size: 26px; }
        }
      `}</style>

      <div className="ier-bread">
        <span>Importer</span>
        <IcArrowR size={10}/>
        <span className="err">Erreur de lecture</span>
      </div>

      <div className="ier-hero">
        <div className="ier-mark">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4"/><path d="M12 17h.01"/>
            <path d="M10.3 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z"/>
          </svg>
        </div>
        <div>
          <div className="ier-l"><span className="dot"/>Impossible de lire ce fichier</div>
          <h2 className="ier-h">Relevé <em>non reconnu</em>.</h2>
          <p className="ier-s">
            {errorMsg || "Ambre n'a pas reconnu la structure du fichier. Consultez les suggestions ci-dessous."}
          </p>
          <div className="ier-meta">
            <span>Fichier · <strong>{name}</strong></span>
          </div>
        </div>
        <div className="ier-actions">
          <button className="ier-btn amber" onClick={onRetry}><IcImport size={14}/>Essayer un autre fichier</button>
          <button className="ier-btn ghost" onClick={onRetry}>↻ Réessayer la lecture</button>
        </div>
      </div>

      <div className="ier-tips">
        <div className="ier-tips-h">Que faire ?</div>
        <div className="ier-tip">
          <span className="num">1</span>
          <div>
            <div style={{ fontWeight: 500, color: "var(--ink-900)" }}>Exportez un CSV depuis votre espace bancaire</div>
            <div style={{ marginTop: 3, color: "var(--ink-500)" }}>Dans votre banque en ligne : Mes comptes → Télécharger → CSV ou Excel. Renommez le fichier en .csv si nécessaire.</div>
          </div>
        </div>
        <div className="ier-tip">
          <span className="num">2</span>
          <div>
            <div style={{ fontWeight: 500, color: "var(--ink-900)" }}>Vérifiez que le CSV a une ligne d'en-tête</div>
            <div style={{ marginTop: 3, color: "var(--ink-500)" }}>La première ligne doit contenir les noms des colonnes : Date, Libellé (ou Description), Montant.</div>
          </div>
        </div>
        <div className="ier-tip">
          <span className="num">3</span>
          <div>
            <div style={{ fontWeight: 500, color: "var(--ink-900)" }}>Formats CSV supportés</div>
            <div style={{ marginTop: 3, color: "var(--ink-500)" }}>Séparateur point-virgule (;) ou virgule (,) · encodage UTF-8 · montants avec virgule ou point décimal.</div>
          </div>
        </div>
        {errorMsg && (
          <div className="ier-errbox">{errorMsg}</div>
        )}
      </div>
    </main>
  );
}
