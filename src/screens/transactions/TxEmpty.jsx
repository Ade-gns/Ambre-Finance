import { IcPlus, IcUpload } from "../../lib/icons";
import { TxHeader, TxFilterBar, TxTableHead } from "./TxAtoms";

/* ─────────────────────────────────────────────────────────────────
   Vue 3 — État vide (aucune transaction sur la période)
   ───────────────────────────────────────────────────────────────── */
export default function TxEmpty() {
  return (
    <main className="tx-main">
      <TxHeader />
      <TxFilterBar withChips={true} />

      <div className="tx-summary">
        <span><strong>0 transaction</strong> · juin 2026</span>
        <span style={{ color: "var(--ink-500)" }}>aucun résultat pour les filtres actifs</span>
        <span style={{ marginLeft: "auto", color: "var(--ink-500)" }}>Dernière sync · il y a 2 min</span>
      </div>

      <div className="tx-empty-card">
        <TxTableHead />
        <div className="tx-empty-body">
          <div className="tx-empty-ico">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <path d="M21 21l-4.3-4.3"/>
              <path d="M8 11h6" opacity="0.4"/>
            </svg>
          </div>
          <div className="tx-empty-t">
            Aucune transaction <em>ne correspond</em>.
          </div>
          <div className="tx-empty-s">
            Juin 2026 n'a encore aucun mouvement enregistré. Vous pouvez ajuster les filtres,
            changer de période, ou importer le prochain relevé.
          </div>
          <div className="tx-empty-suggest">
            <span style={{
              fontSize: 10, color: "var(--ink-500)", letterSpacing: "0.1em",
              textTransform: "uppercase", alignSelf: "center", marginRight: 4
            }}>Suggestions</span>
            <button className="tx-empty-chip amber">← Revenir à mai 2026</button>
            <button className="tx-empty-chip">Tout effacer les filtres</button>
            <button className="tx-empty-chip">Voir tout depuis le début</button>
            <button className="tx-empty-chip">Période personnalisée</button>
          </div>
          <div className="tx-empty-actions">
            <button className="tx-btn amber" style={{ padding: "9px 16px", fontSize: 13 }}>
              <IcUpload size={14}/>Importer un relevé pour juin
            </button>
            <button className="tx-btn" style={{ padding: "9px 16px", fontSize: 13 }}>
              <IcPlus size={14}/>Ajouter manuellement
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

