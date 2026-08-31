import { useNavigate } from "react-router-dom";
import { fmtEUR } from "../../lib/chartPrimitives";
import { IcLock, IcArrowR, IcHome, IcList, IcImport, IcTag, IcBell } from "../../lib/icons";

/* ─────────────────────────────────────────────────────────────────
   3. Succès — confirmation + récap + prochaines étapes
   ───────────────────────────────────────────────────────────────── */
export default function ImportSuccess({ onAgain, txs, fileName }) {
  const navigate = useNavigate();
  const count  = txs?.length || 47;
  const debit  = txs ? txs.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0) : -1695;
  const credit = txs ? txs.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0) : 2560;
  const name   = fileName || "releve-bnp-avril-2026.pdf";

  return (
    <main className="su-main">
      <style>{`
        .su-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 18px; height: 100%; overflow: auto;
                   background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
        .su-bread { font-size: 11px; color: var(--ink-500);
                    letter-spacing: 0.06em; text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .su-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }

        .su-hero { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 16px; padding: 48px 56px;
                   display: grid; grid-template-columns: 100px 1fr auto;
                   gap: 32px; align-items: center; position: relative; overflow: hidden; }
        .su-hero::before { content: ""; position: absolute; inset: 0; opacity: 0.5;
                           background-image: radial-gradient(circle at 90% 50%, rgba(107,122,79,0.08), transparent 60%); }
        .su-hero > * { position: relative; z-index: 1; }
        .su-check { width: 80px; height: 80px; border-radius: 50%;
                    background: linear-gradient(135deg, #9aaa7d, #6b7a4f);
                    color: var(--cream-50);
                    display: flex; align-items: center; justify-content: center;
                    box-shadow: 0 8px 20px rgba(107,122,79,0.25); }
        .su-hero-l { font-size: 11px; color: var(--sage-500);
                     letter-spacing: 0.1em; text-transform: uppercase;
                     display: flex; align-items: center; gap: 8px; }
        .su-hero-h { font-family: var(--font-display); font-size: 44px; line-height: 1.05;
                     color: var(--ink-900); letter-spacing: -0.02em;
                     margin: 6px 0 4px; font-weight: 400; }
        .su-hero-h em { font-style: italic; color: var(--sage-500); }
        .su-hero-s { font-size: 14px; color: var(--ink-600); line-height: 1.5; max-width: 540px; }
        .su-hero-meta { display: flex; gap: 16px; margin-top: 12px;
                        font-size: 11px; color: var(--ink-500); }
        .su-hero-meta strong { color: var(--ink-800); font-family: var(--font-mono); font-weight: 500; }

        .su-hero-actions { display: flex; flex-direction: column; gap: 8px;
                           align-items: stretch; min-width: 220px; }
        .su-btn { display: inline-flex; align-items: center; gap: 8px;
                  padding: 10px 16px; border: 1px solid var(--line);
                  border-radius: 9px; background: var(--cream-50);
                  color: var(--ink-700); font-size: 13px;
                  justify-content: center; cursor: pointer; }
        .su-btn.primary { background: var(--ink-800); color: var(--cream-50);
                          border-color: var(--ink-800); font-weight: 500; }
        .su-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        .su-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .su-stat { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 12px; padding: 14px 18px;
                   display: flex; flex-direction: column; gap: 4px; }
        .su-stat-l { font-size: 10px; color: var(--ink-500);
                     letter-spacing: 0.08em; text-transform: uppercase; }
        .su-stat-v { font-family: var(--font-display); font-size: 26px;
                     color: var(--ink-900); line-height: 1.1; margin-top: 4px; }
        .su-stat-s { font-size: 11px; color: var(--ink-500); font-family: var(--font-mono); }

        .su-bot { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; }
        .su-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px;
                   display: flex; flex-direction: column; overflow: hidden; }
        .su-card-h { padding: 16px 20px 12px; border-bottom: 1px solid var(--line);
                     display: flex; align-items: flex-start; justify-content: space-between; }
        .su-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .su-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .su-next { padding: 18px 22px; display: flex; flex-direction: column; gap: 10px; }
        .su-next-item { display: grid; grid-template-columns: 36px 1fr auto; gap: 12px;
                        align-items: center; padding: 12px; border-radius: 10px;
                        cursor: pointer; background: var(--cream-100);
                        border: 1px solid var(--line); }
        .su-next-item:hover { border-color: var(--amber-500); }
        .su-next-item.primary { background: var(--amber-100); border-color: rgba(184,105,61,0.3); }
        .su-next-ico { width: 36px; height: 36px; border-radius: 9px;
                       background: var(--cream-50);
                       display: flex; align-items: center; justify-content: center;
                       color: var(--amber-500); }
        .su-next-t { font-size: 13px; color: var(--ink-900); font-weight: 500; }
        .su-next-s { font-size: 11px; color: var(--ink-600); margin-top: 2px; }

        .su-reassure { display: flex; align-items: center; gap: 8px;
                       padding: 10px 14px; background: var(--cream-100);
                       border-radius: 8px;
                       font-size: 11.5px; color: var(--sage-500); margin-top: auto; }

        @media (max-width: 768px) {
          .su-main { padding: 14px 12px; }
          .su-hero { grid-template-columns: 1fr; padding: 28px 20px; gap: 16px; }
          .su-hero-h { font-size: 32px; }
          .su-stats { grid-template-columns: 1fr 1fr; }
          .su-bot { grid-template-columns: 1fr; }
          .su-hero-actions { min-width: 0; }
        }
      `}</style>

      <div className="su-bread">
        <span>Importer</span>
        <IcArrowR size={10}/>
        <span>Aperçu</span>
        <IcArrowR size={10}/>
        <strong>Succès</strong>
      </div>

      <div className="su-hero">
        <div className="su-check">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12.5l5.5 5.5L20 7"/>
          </svg>
        </div>
        <div>
          <div className="su-hero-l">
            <span style={{ width: 6, height: 6, borderRadius: 999, background: "var(--sage-500)" }}/>
            Import terminé
          </div>
          <h2 className="su-hero-h">
            {count} transactions ajoutées<br/>
            <em>à votre journal.</em>
          </h2>
          <p className="su-hero-s">
            Le relevé a été lu et classé. Vous pouvez modifier la catégorie
            de n'importe quelle transaction à tout moment depuis la liste.
          </p>
          <div className="su-hero-meta">
            <span>Fichier · <strong>{name}</strong></span>
            <span>Transactions · <strong>{count}</strong></span>
          </div>
        </div>
        <div className="su-hero-actions">
          <button className="su-btn primary" onClick={() => navigate("/transactions")}><IcList size={14}/>Voir mes transactions</button>
          <button className="su-btn" onClick={() => navigate("/")}><IcHome size={14}/>Retour au tableau</button>
          <button className="su-btn ghost" onClick={onAgain}>↺ Importer un autre relevé</button>
        </div>
      </div>

      <div className="su-stats">
        <div className="su-stat">
          <div className="su-stat-l">Transactions ajoutées</div>
          <div className="su-stat-v">{count}</div>
          <div className="su-stat-s">0 doublon · 0 ignorée</div>
        </div>
        <div className="su-stat">
          <div className="su-stat-l">Total débits</div>
          <div className="su-stat-v" style={{ color: "var(--rose-500)" }}>{fmtEUR(debit, 2)}</div>
          <div className="su-stat-s">{txs ? txs.filter(t => t.amt < 0).length : 42} mouvements</div>
        </div>
        <div className="su-stat">
          <div className="su-stat-l">Total crédits</div>
          <div className="su-stat-v" style={{ color: "var(--sage-500)" }}>+{fmtEUR(Math.abs(credit), 2)}</div>
          <div className="su-stat-s">{txs ? txs.filter(t => t.amt > 0).length : 5} mouvements</div>
        </div>
        <div className="su-stat">
          <div className="su-stat-l">Solde net</div>
          <div className="su-stat-v" style={{ color: (credit + debit) >= 0 ? "var(--sage-500)" : "var(--rose-500)" }}>
            {(credit + debit) >= 0 ? "+" : ""}{fmtEUR(credit + debit, 2)}
          </div>
          <div className="su-stat-s">sur la période</div>
        </div>
      </div>

      <div className="su-bot">
        <div className="su-card">
          <div className="su-card-h">
            <div>
              <div className="su-card-t">Et maintenant ?</div>
              <div className="su-card-s">trois pistes pour démarrer</div>
            </div>
          </div>
          <div className="su-next">
            <div className="su-next-item primary">
              <div className="su-next-ico"><IcBell size={16}/></div>
              <div>
                <div className="su-next-t">Vérifier les transactions non classées</div>
                <div className="su-next-s">Quelques libellés n'ont pas été reconnus — un rapide coup d'œil suffira.</div>
              </div>
              <IcArrowR size={14} style={{ color: "var(--amber-500)" }}/>
            </div>
            <div className="su-next-item" onClick={onAgain}>
              <div className="su-next-ico"><IcImport size={16}/></div>
              <div>
                <div className="su-next-t">Importer un autre relevé</div>
                <div className="su-next-s">Comparez avec d'autres périodes ou d'autres comptes.</div>
              </div>
              <IcArrowR size={14} style={{ color: "var(--ink-500)" }}/>
            </div>
            <div className="su-next-item">
              <div className="su-next-ico"><IcTag size={16}/></div>
              <div>
                <div className="su-next-t">Créer des règles pour les récurrentes</div>
                <div className="su-next-s">Automatiser le classement des libellés répétitifs.</div>
              </div>
              <IcArrowR size={14} style={{ color: "var(--ink-500)" }}/>
            </div>
            <div className="su-reassure">
              <IcLock size={11}/>
              Aucune donnée n'a quitté votre appareil pendant cet import.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

