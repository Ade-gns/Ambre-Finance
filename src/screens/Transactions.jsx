/* Écran Transactions — 4 états gérés via useState
   1. default — table groupée par semaine
   2. detail  — panneau latéral ouvert sur une transaction
   3. empty   — aucun résultat / aucune donnée
   4. bulk    — sélection multiple (bulk actions bar) */

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTransactions } from "../lib/store";
import { TX_STYLES } from "./transactions/txStyles";
import TxDefault from "./transactions/TxDefault";
import TxDetail from "./transactions/TxDetail";
import TxBulk from "./transactions/TxBulk";

export default function Transactions() {
  const navigate = useNavigate();
  const location = useLocation();
  const [allTxs] = useTransactions();
  const [selectedTx, setSelectedTx] = useState(null);
  const [bulkMode, setBulkMode]     = useState(false);
  const bulkStartRef                = useRef(null);   // index pré-sélectionné à l'entrée

  const openDetail  = tx  => { setSelectedTx(tx); setBulkMode(false); };
  const closeDetail = ()  => setSelectedTx(null);
  const openBulk    = (startIdx = null) => {
    bulkStartRef.current = startIdx;
    setBulkMode(true);
    setSelectedTx(null);
  };
  const closeBulk = () => setBulkMode(false);

  // Réagit aux navigations depuis la palette de commandes
  useEffect(() => {
    const s = location.state;
    if (!s) return;
    if (s.selectedTxId) {
      const tx = allTxs.find(t => String(t.id) === String(s.selectedTxId));
      if (tx) openDetail(tx);
    }
    navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- fires once on mount

  return (
    <>
      <style>{TX_STYLES}</style>

      {bulkMode ? (
        <TxBulk onClose={closeBulk} startIdx={bulkStartRef.current}/>
      ) : selectedTx ? (
        <TxDetail t={selectedTx} onClose={closeDetail}/>
      ) : (
        <TxDefault onRowClick={openDetail} onSelectMany={openBulk} autoOpenAdd={!!location.state?.openAddForm}/>
      )}
    </>
  );
}

