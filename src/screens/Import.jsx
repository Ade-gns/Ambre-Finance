/* Écran Import — workflow complet en 4 états
   1. empty   — drop zone + historique + sources
   2. preview — table des transactions extraites (données réelles)
   3. success — confirmation et prochaines étapes
   4. error   — erreur de lecture + cas fréquents */

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTransactions, useImportHistory, normalizeTransaction, useAutoRules } from "../lib/store";
import { parseCSV, fmtSize } from "./import/csvParser";
import ImportEmpty from "./import/ImportEmpty";
import ImportPreview from "./import/ImportPreview";
import ImportSuccess from "./import/ImportSuccess";
import ImportError from "./import/ImportError";

export default function Import() {
  const location = useLocation();
  const [, setTransactions] = useTransactions();
  const [importHistory, setImportHistory] = useImportHistory();
  const [autoRules] = useAutoRules();
  const [state, setState]           = useState("empty");
  const [parsedTxs, setParsedTxs]   = useState(null);
  const [fileName, setFileName]     = useState("");
  const [fileSize, setFileSize]     = useState(0);
  const [parseError, setParseError] = useState("");

  const handleFile = file => {
    if (!file) return;
    setFileName(file.name);
    setFileSize(file.size);
    const ext = file.name.split(".").pop().toLowerCase();

    if (ext === "csv" || ext === "txt") {
      const readAs = (encoding) => new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload  = e => resolve(e.target.result);
        r.onerror = () => reject(new Error("Lecture impossible"));
        r.readAsText(file, encoding);
      });
      (async () => {
        try {
          let text = await readAs("UTF-8");
          // Si le fichier n'est pas en UTF-8 (ex : Windows-1252/ISO-8859-1 courants chez
          // les banques françaises), on obtient des caractères de remplacement U+FFFD —
          // on réessaie avec les encodages les plus probables jusqu'à ce que ça disparaisse.
          for (const enc of ["windows-1252", "ISO-8859-1"]) {
            if (!text.includes("�")) break;
            text = await readAs(enc);
          }
          const txs = parseCSV(text, autoRules);
          if (txs && txs.length > 0) {
            setParsedTxs(txs);
            setState("preview");
          } else {
            setParseError("Format CSV non reconnu ou fichier vide. Vérifiez que le fichier contient une ligne d'en-tête avec les colonnes Date, Libellé et Montant.");
            setState("error");
          }
        } catch {
          setParseError("Impossible de lire le fichier.");
          setState("error");
        }
      })();
    } else if (ext === "pdf") {
      (async () => {
        try {
          // Import dynamique : pdfjs-dist (~1,3 Mo avec son worker) n'est
          // chargé que si l'utilisateur importe effectivement un PDF, pas au
          // démarrage de l'app.
          const { parsePdfBankStatement } = await import("./import/pdf/parsePdf");
          const buffer = await file.arrayBuffer();
          const result = await parsePdfBankStatement(buffer, autoRules);

          if (result.error === "password") {
            setParseError("Ce PDF est protégé par un mot de passe. Retirez la protection (ou exportez un CSV depuis votre espace bancaire) avant de l'importer.");
            setState("error");
          } else if (result.error === "no-text") {
            setParseError("Ce PDF ne contient pas de texte extractible — c'est probablement un scan ou une image plutôt qu'un PDF natif. Réessayez avec l'export PDF original de votre banque, ou un CSV.");
            setState("error");
          } else if (result.error === "no-transactions" || result.error === "corrupt") {
            setParseError("Aucune transaction reconnaissable dans ce PDF. Le format de ce relevé n'est peut-être pas encore pris en charge — exportez un CSV depuis votre espace bancaire en attendant.");
            setState("error");
          } else {
            setParsedTxs(result.transactions);
            setState("preview");
          }
        } catch (err) {
          setParseError("Impossible de lire ce PDF" + (err?.message ? " : " + err.message : "") + ". Le fichier est peut-être corrompu.");
          setState("error");
        }
      })();
    } else if (ext === "ofx" || ext === "qif") {
      setParseError(`La lecture des fichiers .${ext} nécessite le moteur Rust (en développement). Exportez un CSV depuis votre espace bancaire en attendant.`);
      setState("error");
    } else {
      setParseError(`Format .${ext} non pris en charge. Formats acceptés : CSV, PDF, OFX, QIF.`);
      setState("error");
    }
  };

  // Fichier transmis depuis l'onboarding via router state → lancer le parsing directement
  useEffect(() => {
    if (location.state?.file) handleFile(location.state.file);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleConfirm(mergedTxs) {
    if (!parsedTxs) return;
    const txsToSave = Array.isArray(mergedTxs) ? mergedTxs : parsedTxs;
    const normalized = txsToSave.map(t => normalizeTransaction(t));
    setTransactions(prev => {
      const ids = new Set(prev.map(t => String(t.id)));
      return [...prev, ...normalized.filter(t => !ids.has(String(t.id)))];
    });
    setImportHistory(prev => [{
      file: fileName,
      date: new Date().toLocaleDateString("fr-FR"),
      tx:   parsedTxs.length,
      size: fmtSize(fileSize),
      period: "—",
      fmt:  (fileName.split(".").pop() || "csv").toLowerCase(),
    }, ...prev.slice(0, 9)]);
    setState("success");
  }

  return (
    <>
      {state === "empty"   && <ImportEmpty   onFile={handleFile} importHistory={importHistory}/>}
      {state === "preview" && <ImportPreview txs={parsedTxs} fileName={fileName} fileSize={fileSize}
                                              onConfirm={handleConfirm} onCancel={() => setState("empty")}/>}
      {state === "success" && <ImportSuccess txs={parsedTxs} fileName={fileName} onAgain={() => setState("empty")}/>}
      {state === "error"   && <ImportError   onRetry={() => setState("empty")} errorMsg={parseError} fileName={fileName}/>}
    </>
  );
}

