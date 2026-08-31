import { useState } from "react";
import { useTransactions, useCategories, useAutoRules, applyRules, parseTxDate } from "../../lib/store";
import { fmtEUR } from "../../lib/chartPrimitives";
import { IcChevDn } from "../../lib/icons";
import { txCatStyle, getWeekGroups } from "./txHelpers";
import { TxHeader, TxFilterBar, TxSummary, TxRow, TxTableHead } from "./TxAtoms";

/* Sous-composant pour la liste dans TxDetail (nécessaire pour les hooks) */
function TxDetailList({ tSel, catDefs }) {
  const [allTxs] = useTransactions();
  const groups = getWeekGroups(allTxs.slice(0, 20)).slice(0, 2);
  return (
    <main className="tx-main with-panel">
      <TxHeader />
      <TxFilterBar />
      <TxSummary />
      <div className="tx-table">
        <TxTableHead />
        <div className="tx-tbody">
          {groups.map((g, gi) => {
            const groupSum = g.txs.reduce((s, t) => s + t.amt, 0);
            return (
              <div key={g.key}>
                <div className="tx-group-h">
                  <span>{g.label}</span>
                  <span className="sum">{groupSum > 0 ? "+" : ""}{fmtEUR(groupSum, 2)}</span>
                </div>
                {g.txs.slice(0, gi === 0 ? 5 : 6).map((t, i) => (
                  <TxRow key={t.id} t={t} catDefs={catDefs}
                         selected={tSel === t} dense={gi > 0}/>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Vue 2 — Liste + panneau de détail
   ───────────────────────────────────────────────────────────────── */
export default function TxDetail({ t: tSel, onClose }) {
  const [catDefs] = useCategories();
  const [allTxs, setAllTxs] = useTransactions();
  const [autoRules, setAutoRules] = useAutoRules();
  const [catId, setCatId]             = useState(tSel.cat);
  const [catPickerOpen, setCatPickerOpen] = useState(false);
  const [deleteState, setDeleteState] = useState(false);
  const [ruleCreated, setRuleCreated] = useState(false);
  const [showRulePrompt, setShowRulePrompt] = useState(false);
  const [note, setNote]               = useState(tSel.note || "");

  const saveNote = val => {
    setAllTxs(prev => prev.map(t => String(t.id) === String(tSel.id) ? { ...t, note: val } : t));
  };
  const catSel = txCatStyle(catId, catDefs);
  const allCats = catDefs;

  const norm = s => (s || "").toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();

  // Mots génériques bancaires à ignorer pour trouver le nom du marchand
  const SKIP = new Set([
    "prlv","prelevement","virement","sepa","carte","retrait","dab","achat",
    "paiement","pmt","chq","cheque","avoir","frais","comm","facture","fact",
    "remboursement","remb","vir","virt","str","tpe","int","prel","men",
    "mensuel","mensuelle","debit","credit","vente","achat","ref","bon",
  ]);

  const simLbl = (() => {
    const words = norm(tSel.lbl).split(" ").filter(w => w.length > 2 && !SKIP.has(w));
    return words.find(w => w.length > 3) || words[0] || "";
  })();

  const similarTxs = allTxs
    .filter(t => {
      if (String(t.id) === String(tSel.id)) return false;
      return simLbl && norm(t.lbl).includes(simLbl);
    })
    .sort((a, b) => { const da = parseTxDate(a.d), db = parseTxDate(b.d); return (db?.getTime() || 0) - (da?.getTime() || 0); })
    .slice(0, 4);

  const handleCreateRule = () => {
    if (!simLbl || ruleCreated) return;
    const newRule = { id: Date.now(), pattern: simLbl, catId, matchType: "contains", active: true, createdAt: new Date().toISOString() };
    // Nouvelle règle EN PREMIER → priorité max sur les anciennes
    setAutoRules([newRule, ...autoRules]);
    // Applique UNIQUEMENT cette règle (évite qu'une ancienne règle conflictuelle écrase)
    setAllTxs(prev => prev.map(t => {
      const cat = applyRules([newRule], t.lbl);
      return cat ? { ...t, cat } : t;
    }));
    setRuleCreated(true);
  };

  return (
    <div className="tx-panel-layout">
      <TxDetailList tSel={tSel} catDefs={catDefs}/>

      <aside className="tx-detail">
        <button className="tx-detail-close" onClick={onClose}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 6l12 12M18 6L6 18"/>
          </svg>
        </button>

        <div>
          <div className="tx-detail-h">Détail · {tSel.d} · {tSel.dow}</div>
          <div className="tx-detail-amt" style={{ color: tSel.amt > 0 ? "var(--sage-500)" : "var(--rose-500)" }}>
            <span className="cur">{tSel.amt > 0 ? "+€" : "−€"}</span>
            {Math.abs(Math.floor(tSel.amt)).toLocaleString("fr-FR")}
            <span className="cents">,{String(Math.abs(tSel.amt).toFixed(2)).split(".")[1]}</span>
          </div>
          <div className="tx-detail-lbl">{tSel.lbl}</div>
          <div className="tx-detail-sub">{tSel.sub}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, position: "relative" }}>
          <div className="tx-field editable" onClick={() => setCatPickerOpen(v => !v)}>
            <span className="lbl">Catégorie</span>
            <span className="val" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span className="amb-dot" style={{ background: catSel.color }}/>
              {catSel.label}
              <IcChevDn size={12}/>
            </span>
          </div>
          {catPickerOpen && (
            <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
                          background: "var(--cream-50)", border: "1px solid var(--amber-500)",
                          borderRadius: 10, padding: 6, boxShadow: "0 4px 14px var(--shadow-soft)" }}>
              {allCats.map(c => (
                <div key={c.id} onClick={() => {
                  const changed = c.id !== catId;
                  setCatId(c.id);
                  setAllTxs(prev => prev.map(t => String(t.id) === String(tSel.id) ? { ...t, cat: c.id } : t));
                  setCatPickerOpen(false);
                  setRuleCreated(false);
                  setShowRulePrompt(changed && similarTxs.length > 0 && !!simLbl);
                }}
                     style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px",
                              borderRadius: 7, cursor: "pointer", fontSize: 12,
                              background: c.id === catId ? "var(--amber-100)" : "transparent",
                              color: c.id === catId ? "var(--amber-500)" : "var(--ink-800)" }}>
                  <span className="amb-dot" style={{ background: c.color }}/>
                  {c.label}
                </div>
              ))}
            </div>
          )}
          <div className="tx-field">
            <span className="lbl">Compte</span>
            <span className="val">{tSel.acc}</span>
          </div>
          <div className="tx-field">
            <span className="lbl">Mode</span>
            <span className="val">{tSel.mode}</span>
          </div>
          <div className="tx-field">
            <span className="lbl">Référence</span>
            <span className="val mono" style={{ fontSize: 11 }}>FR76 3000 4001 …7849</span>
          </div>
        </div>

        {showRulePrompt && !ruleCreated && (
          <div style={{ background: "var(--amber-100)", border: "1px solid var(--amber-500)",
                        borderRadius: 10, padding: "12px 14px", display: "flex",
                        flexDirection: "column", gap: 8 }}>
            <div style={{ fontSize: 12, color: "var(--ink-800)", fontWeight: 500 }}>
              {similarTxs.length} opération{similarTxs.length > 1 ? "s" : ""} similaire{similarTxs.length > 1 ? "s" : ""} trouvée{similarTxs.length > 1 ? "s" : ""}
            </div>
            <div style={{ fontSize: 11, color: "var(--ink-600)" }}>
              Créer une règle pour classer automatiquement « {simLbl} » dans cette catégorie ?
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="tx-btn amber" style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => { handleCreateRule(); setShowRulePrompt(false); }}>
                Oui, créer la règle
              </button>
              <button className="tx-btn ghost" style={{ fontSize: 11, padding: "4px 10px" }}
                      onClick={() => setShowRulePrompt(false)}>
                Non merci
              </button>
            </div>
          </div>
        )}
        {ruleCreated && (
          <div style={{ background: "var(--cream-100)", border: "1px solid var(--line)",
                        borderRadius: 10, padding: "10px 14px", fontSize: 11,
                        color: "var(--ink-600)", display: "flex", alignItems: "center", gap: 8 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--sage-500)" strokeWidth="2.2" strokeLinecap="round">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
            Règle « {simLbl} » créée — les prochaines transactions seront classées automatiquement.
          </div>
        )}

        <div className="tx-detail-section">
          <div className="tx-detail-section-t">Notes</div>
          <textarea
            className="tx-notes"
            placeholder="Ajouter une note…"
            value={note}
            onChange={e => setNote(e.target.value)}
            onBlur={e => saveNote(e.target.value)}
            rows={3}
          />
        </div>

        {similarTxs.length > 0 && (
        <div className="tx-detail-section">
          <div className="tx-detail-section-t">
            Transactions similaires <span style={{ color: "var(--amber-500)" }}>· {similarTxs.length}</span>
          </div>
          <div className="tx-similar">
            {similarTxs.map((s, i) => (
              <div key={i} className="tx-similar-row">
                <span className="date">{s.d?.slice(0, 5) || s.d}</span>
                <span style={{ color: "var(--ink-800)" }}>{s.lbl}</span>
                <span className="amt">{fmtEUR(s.amt, 2)}</span>
              </div>
            ))}
          </div>
        </div>
        )}

        <div className="tx-rule">
          <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--cream-50)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "var(--amber-500)", flexShrink: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                 strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div className="tx-rule-t">
              {ruleCreated
                ? `Règle « ${simLbl} » créée ✓`
                : `Classer « ${simLbl || tSel.lbl.slice(0, 20)} » en ${catSel.label} ?`}
            </div>
            <div className="tx-rule-s">
              {similarTxs.length > 0
                ? `${similarTxs.length} transaction${similarTxs.length > 1 ? "s" : ""} similaire${similarTxs.length > 1 ? "s" : ""} détectée${similarTxs.length > 1 ? "s" : ""}.`
                : "Aucune transaction similaire pour l'instant."}
            </div>
            {!ruleCreated && simLbl && (
              <button className="tx-btn amber tx-rule-cta" style={{ padding: "5px 10px", fontSize: 11 }}
                      onClick={handleCreateRule}>
                Créer la règle
              </button>
            )}
          </div>
        </div>

        <div className="tx-detail-section" style={{ flexDirection: "row", gap: 8 }}>
          <button className="tx-btn ghost" style={{ fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            Scinder
          </button>
          <button className="tx-btn ghost" style={{ fontSize: 11 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11h6M9 15h4"/><path d="M5 7l7-5 7 5v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z"/>
            </svg>
            Dupliquer
          </button>
          <span style={{ flex: 1 }}/>
          <button className="tx-danger-btn"
                  onClick={() => {
                    if (deleteState) {
                      setAllTxs(prev => prev.filter(t => String(t.id) !== String(tSel.id)));
                      onClose();
                    } else {
                      setDeleteState(true);
                      setTimeout(() => setDeleteState(false), 3000);
                    }
                  }}
                  style={{ borderColor: deleteState ? "var(--rose-500)" : undefined,
                           background: deleteState ? "rgba(168,90,72,0.08)" : undefined }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            </svg>
            {deleteState ? "Confirmer la suppression ?" : "Supprimer"}
          </button>
        </div>
      </aside>
    </div>
  );
}

