/* Écran Import — workflow complet en 4 états
   1. empty   — drop zone + historique + sources
   2. preview — table des transactions extraites (données réelles)
   3. success — confirmation et prochaines étapes
   4. error   — erreur de lecture + cas fréquents */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions, useImportHistory, normalizeTransaction } from "../lib/store";
import { fmtEUR } from "../lib/chartPrimitives";
import {
  IcCalendar, IcSearch, IcUpload, IcLock, IcArrowR, IcChevDn,
  IcPlus, IcHome, IcList, IcImport, IcTag, IcBell
} from "../lib/icons";

/* ─────────────────────────────────────────────────────────────────
   Parser CSV générique — séparateurs ; , \t |  — gère les champs
   quotés, le BOM UTF-8, les métadonnées en tête de fichier et les
   montants avec espace comme séparateur de milliers.
   ───────────────────────────────────────────────────────────────── */
function parseCsvRow(row, sep) {
  const cells = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') { inQ = !inQ; }
    else if (ch === sep && !inQ) { cells.push(field.trim()); field = ""; }
    else { field += ch; }
  }
  cells.push(field.trim());
  return cells;
}

function detectSeparator(line) {
  const candidates = [";", "\t", "|", ","];
  let best = ","; let bestCount = 0;
  for (const c of candidates) {
    const count = (line.match(new RegExp(c === "|" ? "\\|" : c, "g")) || []).length;
    if (count > bestCount) { best = c; bestCount = count; }
  }
  return best;
}

function normalizeDate(raw) {
  const MONTHS_FR = ["jan","fev","mar","avr","mai","jun","jul","aou","sep","oct","nov","dec"];
  const MONTHS_EN = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  let d = raw.replace(/[.\-]/g, "/").trim();
  const curYear = new Date().getFullYear();
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) return d.slice(8) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(d)) return d.slice(0, 6) + "20" + d.slice(6);
  if (/^\d{2}\/\d{2}$/.test(d))        return d + "/" + curYear;
  // "20 Jan 2026" / "20-Jan-2026"
  const m = raw.match(/^(\d{1,2})[\s\-/]([a-zA-Zéûô]{3,})[\s\-/](\d{2,4})$/i);
  if (m) {
    const mon = m[2].toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").slice(0, 3);
    const mi  = MONTHS_FR.indexOf(mon) !== -1 ? MONTHS_FR.indexOf(mon) : MONTHS_EN.indexOf(mon);
    if (mi !== -1) {
      const yr = m[3].length === 2 ? "20" + m[3] : m[3];
      return String(m[1]).padStart(2, "0") + "/" + String(mi + 1).padStart(2, "0") + "/" + yr;
    }
  }
  return d;
}

const SKIP_LABELS = /^(solde|total|balance|report|a nouveau|cumul|sous.total)/i;

function parseAmt(raw) {
  if (!raw) return NaN;
  const clean = raw.trim().replace(/\s/g, "").replace(/,/g, ".").replace(/[^0-9.\-+]/g, "");
  return parseFloat(clean);
}

// Mapping des catégories bancaires vers les IDs Ambre
const BANK_CAT_MAP = {
  alim: ["alim", "course", "alimentation", "epicerie", "supermarch", "hypermarche"],
  loy:  ["logement", "loyer"],
  tra:  ["transport", "navigo", "vtc", "taxi", "parking", "stationnement", "auto", "peage"],
  loi:  ["loisir", "restaurant", "bar", "cafe", "jeu", "voyage", "shopping", "vetement", "livraison", "achat"],
  san:  ["sante", "pharma", "medecin", "sport", "salle", "fitness", "hygiene"],
  abo:  ["abo", "streaming", "telephone", "internet", "mobile", "numerique"],
  inc:  ["revenu", "salaire", "aide", "allocation", "caf"],
  epa:  ["epargne", "livret", "pel", "cloture"],
};

function mapBankCat(raw) {
  if (!raw) return null;
  const n = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [id, kws] of Object.entries(BANK_CAT_MAP)) {
    if (kws.some(k => n.includes(k))) return id;
  }
  return null;
}

function parseCSV(rawText) {
  const text = rawText.replace(/^﻿/, ""); // strip BOM
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  const sep = detectSeparator(lines[0]);
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/"/g, "").trim();

  // Trouver la ligne d'en-tête réelle (sauter les métadonnées bancaires)
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length - 1, 10); i++) {
    const cells = parseCsvRow(lines[i], sep).map(norm);
    const hasDate = cells.some(c => c.includes("date") || c.includes("jour"));
    const hasAmt  = cells.some(c => c.includes("montant") || c.includes("amount") || c.includes("debit") || c.includes("credit") || c.includes("valeur") || c.includes("retrait"));
    const hasLbl  = cells.some(c => c.includes("libel") || c.includes("descri") || c.includes("label") || c.includes("intitule") || c.includes("wording") || c.includes("motif"));
    if ((hasDate && hasAmt) || (hasDate && hasLbl) || (hasLbl && hasAmt)) { headerIdx = i; break; }
  }

  const header = parseCsvRow(lines[headerIdx], sep).map(norm);
  const idx = (kws) => header.findIndex(c => kws.some(k => c.includes(k)));

  // "date_op" avant "date" pour préférer date_operation sur date_compta
  // "operation" retiré de lblIdx car il matche "date_operation"
  const dateIdx = idx(["date_op", "date op", "date_val", "date val", "date", "jour"]);
  const lblIdx  = idx(["libel", "descri", "label", "intitule", "wording", "motif"]);
  const amtIdx  = idx(["montant", "amount", "somme"]);
  const debIdx  = idx(["debit", "retrait", "depit"]);
  const credIdx = idx(["credit", "versement", "depot"]);
  const catIdx  = idx(["categorie", "category"]);
  // "type" avant "detail" : couvre la colonne "type" des exports bancaires (Carte bancaire, Prélèvement…)
  const subIdx  = idx(["type", "detail", "info", "complement", "communication"]);

  if (dateIdx === -1 && lblIdx === -1) return null;

  const eDateIdx = dateIdx !== -1 ? dateIdx : 0;
  const eLblIdx  = lblIdx  !== -1 ? lblIdx  : 1;

  const txs = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i], sep);
    if (cells.length < 2) continue;
    const lbl = (cells[eLblIdx] || "").replace(/"/g, "").trim();
    if (SKIP_LABELS.test(lbl)) continue; // ignorer lignes de solde / totaux

    let amt = NaN;
    if (amtIdx !== -1) {
      amt = parseAmt(cells[amtIdx]);
    } else if (debIdx !== -1 || credIdx !== -1) {
      const deb  = debIdx  !== -1 ? parseAmt(cells[debIdx])  : NaN;
      const cred = credIdx !== -1 ? parseAmt(cells[credIdx]) : NaN;
      const dv = isNaN(deb)  ? 0 : deb;
      const cv = isNaN(cred) ? 0 : cred;
      if (cv > 0) amt = cv;
      else if (dv > 0) amt = -dv;
      else if (!isNaN(deb) && dv < 0) amt = dv;
    }
    if (isNaN(amt) || amt === 0) continue;

    const bankCat = catIdx !== -1 ? (cells[catIdx] || "").replace(/"/g, "").trim() : "";
    const mappedCat = mapBankCat(bankCat);

    txs.push({
      d:    normalizeDate(cells[eDateIdx] || ""),
      lbl:  lbl || "—",
      sub:  subIdx !== -1 ? (cells[subIdx] || "").replace(/"/g, "").trim() : bankCat,
      cat:  mappedCat,
      conf: mappedCat ? "high" : "none",
      amt,
    });
  }
  return txs.length > 0 ? txs : null;
}

function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

/* ─────────────────────────────────────────────────────────────────
   Composant principal
   ───────────────────────────────────────────────────────────────── */
export default function Import() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useTransactions();
  const [importHistory, setImportHistory] = useImportHistory();
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
          // Si le fichier n'est pas en UTF-8 (ex : ISO-8859-1 courant chez les banques
          // françaises), on obtient des caractères de remplacement U+FFFD — on réessaie.
          if (text.includes("�")) text = await readAs("ISO-8859-1");
          const txs = parseCSV(text);
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
    } else if (ext === "pdf" || ext === "ofx" || ext === "qif") {
      setParseError(`La lecture des fichiers .${ext} nécessite le moteur Rust (en développement). Exportez un CSV depuis votre espace bancaire en attendant.`);
      setState("error");
    } else {
      setParseError(`Format .${ext} non pris en charge. Formats acceptés : CSV, PDF, OFX, QIF.`);
      setState("error");
    }
  };

  function handleConfirm() {
    if (!parsedTxs) return;
    localStorage.removeItem("ambre.sampleMode");
    const normalized = parsedTxs.map(t => normalizeTransaction(t));
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
      fmt:  "csv",
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

/* ─────────────────────────────────────────────────────────────────
   1. État vide — drop zone + historique + sources reconnues
   ───────────────────────────────────────────────────────────────── */
function ImportEmpty({ onFile, importHistory = [] }) {
  const fileRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [histFilter, setHistFilter] = useState("all"); // "all" | "pdf" | "csv"
  const [addSourceOpen, setAddSourceOpen] = useState(false);
  const [newSourceName, setNewSourceName] = useState("");
  const [newSourceFmt, setNewSourceFmt] = useState("CSV");
  const [userSources, setUserSources] = useState([]);

  const sources = [
    { name: "BNP Paribas",            fmt: "PDF, CSV", last: "Avril 2026", status: "ok" },
    { name: "La Banque Postale",      fmt: "PDF, CSV", last: "Mars 2026",  status: "ok" },
    { name: "Crédit Agricole",        fmt: "PDF, OFX", last: "Jamais",     status: "new" },
    { name: "Boursorama",             fmt: "CSV, OFX", last: "Jamais",     status: "new" },
    { name: "Revolut",                fmt: "CSV",      last: "Jamais",     status: "new" },
    { name: "Autre — CSV générique",  fmt: "CSV",      last: null,         status: "generic" },
  ];

  const allSources = [...sources, ...userSources].filter(s =>
    !searchQ || s.name.toLowerCase().includes(searchQ.toLowerCase())
  );

  const filteredHistory = importHistory.filter(h => {
    if (histFilter === "all") return true;
    return h.file.toLowerCase().endsWith("." + histFilter);
  });

  const onDrop = e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  };

  return (
    <main className="ie-main">
      <style>{`
        .ie-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 16px; height: 100%; overflow: auto;
                   background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
        .ie-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ie-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ie-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ie-h1 { font-family: var(--font-display); font-size: 28px; font-weight: 400;
                 margin: 4px 0 0; color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-h1 em { font-style: italic; color: var(--amber-500); }
        .ie-tool { display: flex; gap: 8px; align-items: center; }
        .ie-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px;
                  background: var(--cream-50); color: var(--ink-700); font-size: 12px;
                  cursor: pointer; }
        .ie-btn.amber { background: var(--amber-500); color: var(--cream-50);
                        border-color: var(--amber-500); font-weight: 500; }

        .ie-drop { background: var(--cream-50);
                   border: 1.5px dashed rgba(184,105,61,0.45);
                   border-radius: 14px; padding: 40px 28px;
                   display: flex; flex-direction: column; align-items: center; gap: 14px;
                   position: relative; overflow: hidden; transition: background 0.15s, border-color 0.15s; }
        .ie-drop.over { background: var(--amber-100); border-color: var(--amber-500); border-style: solid; }
        .ie-drop::before { content: ""; position: absolute; inset: 0;
                           background-image: repeating-linear-gradient(45deg, transparent 0 14px, rgba(184,105,61,0.025) 14px 16px);
                           pointer-events: none; }
        .ie-drop > * { position: relative; z-index: 1; }
        .ie-drop-ico { width: 60px; height: 60px; border-radius: 16px;
                       background: var(--amber-100); color: var(--amber-500);
                       display: flex; align-items: center; justify-content: center; }
        .ie-drop-t { font-family: var(--font-display); font-size: 26px;
                     color: var(--ink-900); letter-spacing: -0.01em; }
        .ie-drop-s { font-size: 13px; color: var(--ink-600); text-align: center; max-width: 480px; }
        .ie-drop-actions { display: flex; gap: 10px; align-items: center; margin-top: 4px; }
        .ie-drop-formats { display: flex; gap: 8px; margin-top: 6px; }
        .ie-fmt-chip { display: inline-flex; align-items: center; gap: 5px; padding: 4px 10px;
                       border-radius: 999px; background: var(--cream-200);
                       font-size: 11px; color: var(--ink-700); font-family: var(--font-mono); }
        .ie-trust { display: flex; align-items: center; gap: 6px; font-size: 11px;
                    color: var(--sage-500);
                    padding-top: 6px; border-top: 1px dashed var(--line); }

        .ie-cols { display: grid; grid-template-columns: 1fr 1.05fr; gap: 14px;
                   flex: 1; min-height: 0; }
        .ie-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px; padding: 18px 20px;
                   display: flex; flex-direction: column; gap: 12px; min-height: 0; }
        .ie-card-h { display: flex; align-items: flex-start; justify-content: space-between; }
        .ie-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ie-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .ie-src-list { display: flex; flex-direction: column; }
        .ie-src-row { display: grid; grid-template-columns: 28px 1fr auto auto;
                      align-items: center; gap: 10px;
                      padding: 10px 0; border-bottom: 1px dashed var(--line); }
        .ie-src-row:last-child { border-bottom: none; }
        .ie-src-mark { width: 28px; height: 28px; border-radius: 7px;
                       background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center;
                       font-family: var(--font-display); font-style: italic;
                       font-size: 15px; color: var(--ink-700); }
        .ie-src-name { font-size: 13px; color: var(--ink-800); }
        .ie-src-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px;
                       font-family: var(--font-mono); }
        .ie-src-last { font-size: 11px; color: var(--ink-500); }
        .ie-src-status { font-size: 10px; padding: 2px 8px; border-radius: 999px;
                         border: 1px solid var(--line); color: var(--ink-600); }
        .ie-src-status.ok { background: rgba(107,122,79,0.10); border-color: rgba(107,122,79,0.35); color: var(--sage-500); }
        .ie-src-status.new { background: var(--amber-100); border-color: rgba(184,105,61,0.35); color: var(--amber-500); }

        .ie-hist-row { display: grid; grid-template-columns: 32px 1fr auto auto; gap: 12px;
                       align-items: center; padding: 12px 0;
                       border-bottom: 1px dashed var(--line); }
        .ie-hist-row:last-child { border-bottom: none; }
        .ie-hist-ico { width: 32px; height: 32px; border-radius: 8px; background: var(--cream-200);
                       display: flex; align-items: center; justify-content: center; color: var(--ink-600); }
        .ie-hist-file { font-size: 12.5px; color: var(--ink-800); font-family: var(--font-mono); }
        .ie-hist-meta { font-size: 11px; color: var(--ink-500); margin-top: 2px; }
        .ie-hist-tx { display: inline-flex; align-items: center; gap: 4px;
                      padding: 3px 8px; border-radius: 999px;
                      background: var(--amber-100); color: var(--amber-500);
                      font-size: 11px; font-weight: 500; }
        .ie-hist-act { display: flex; gap: 6px; }
        .ie-hist-act > button { width: 26px; height: 26px; padding: 0; }
      `}</style>

      {/* Input fichier caché — déclenché par le bouton */}
      <input ref={fileRef} type="file" accept=".csv,.pdf,.ofx,.qif,.txt"
             style={{ display: "none" }}
             onChange={e => { const f = e.target.files[0]; if (f) onFile(f); e.target.value = ""; }} />

      <div className="ie-top">
        <div>
          <div className="ie-bread">Ambre · <strong>Importer un relevé</strong></div>
          <h1 className="ie-h1">Ajouter un <em>relevé</em>.</h1>
        </div>
        <div className="ie-tool">
          {searchOpen && (
            <input
              autoFocus
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Rechercher une source…"
              style={{
                padding: "6px 10px", borderRadius: 8, border: "1px solid var(--line)",
                background: "var(--cream-50)", fontSize: 12, color: "var(--ink-800)",
                outline: "none", width: 200,
              }}
            />
          )}
          <button className="ie-btn" onClick={() => setHistOpen(true)}>
            <IcCalendar size={14}/>Historique complet
          </button>
          <button className="ie-btn" onClick={() => { setSearchOpen(o => !o); if (searchOpen) setSearchQ(""); }}>
            <IcSearch size={14}/>
          </button>
        </div>
      </div>

      {/* DROP ZONE */}
      <div className={"ie-drop" + (dragging ? " over" : "")}
           onDragOver={e => { e.preventDefault(); setDragging(true); }}
           onDragEnter={e => { e.preventDefault(); setDragging(true); }}
           onDragLeave={() => setDragging(false)}
           onDrop={onDrop}>
        <div className="ie-drop-ico">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6"
               strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 4h10l5 5v18a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
            <path d="M19 4v5h5"/>
            <path d="M16 22V14"/>
            <path d="M12 18l4-4 4 4"/>
          </svg>
        </div>
        <div className="ie-drop-t">
          {dragging ? "Déposez le fichier ici" : "Glissez un relevé ici"}
        </div>
        <div className="ie-drop-s">
          Ambre lit les relevés PDF de la plupart des banques françaises et les fichiers CSV
          génériques. Les transactions sont extraites et pré-classées automatiquement.
        </div>
        <div className="ie-drop-actions">
          <button className="ie-btn amber" style={{ padding: "9px 16px", fontSize: 13 }}
                  onClick={() => fileRef.current?.click()}>
            <IcUpload size={14}/>Parcourir mes fichiers
          </button>
          <span style={{ fontSize: 12, color: "var(--ink-500)" }}>ou faites glisser le fichier</span>
        </div>
        <div className="ie-drop-formats">
          <span className="ie-fmt-chip">.pdf</span>
          <span className="ie-fmt-chip">.csv</span>
          <span className="ie-fmt-chip">.ofx</span>
          <span className="ie-fmt-chip">.qif</span>
        </div>
        <div className="ie-trust">
          <IcLock size={11}/>
          Lecture 100 % locale · aucun fichier n'est transmis ni stocké en ligne
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="ie-cols">
        {/* SOURCES */}
        <div className="ie-card">
          <div className="ie-card-h">
            <div>
              <div className="ie-card-t">Sources reconnues</div>
              <div className="ie-card-s">6 formats pris en charge · ajoutez les vôtres dans Paramètres</div>
            </div>
            <button className="ie-btn" style={{ padding: "4px 10px", fontSize: 11 }}
                    onClick={() => setAddSourceOpen(true)}>
              <IcPlus size={11}/>Ajouter
            </button>
          </div>
          <div className="ie-src-list">
            {allSources.map(s => (
              <div key={s.name} className="ie-src-row">
                <div className="ie-src-mark">{s.name[0].toLowerCase()}</div>
                <div>
                  <div className="ie-src-name">{s.name}</div>
                  <div className="ie-src-meta">{s.fmt}</div>
                </div>
                <div className="ie-src-last">{s.last || "—"}</div>
                <div className={"ie-src-status " + s.status}>
                  {s.status === "ok" ? "Configurée" : s.status === "new" ? "À configurer" : "Manuel"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HISTORY */}
        <div className="ie-card" style={{ overflow: "hidden" }}>
          <div className="ie-card-h">
            <div>
              <div className="ie-card-t">Imports récents</div>
              <div className="ie-card-s">
                {importHistory.length > 0
                  ? `${importHistory.length} fichier${importHistory.length > 1 ? "s" : ""} · ${importHistory.reduce((s, h) => s + (h.tx || 0), 0)} transactions importées`
                  : "Aucun import pour l'instant"}
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              {[["all","Tous"],["pdf","PDF"],["csv","CSV"]].map(([k,label]) => (
                <button key={k} className="ie-btn" style={{ padding: "4px 10px", fontSize: 11,
                  ...(histFilter === k ? { background: "var(--amber-100)", color: "var(--amber-500)", borderColor: "rgba(184,105,61,0.3)" } : {})
                }} onClick={() => setHistFilter(k)}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ overflow: "hidden" }}>
            {filteredHistory.length === 0 ? (
              <div style={{ padding: "24px 20px", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                Aucun import enregistré.
              </div>
            ) : filteredHistory.map((h, idx) => (
              <div key={idx} className="ie-hist-row">
                <div className="ie-hist-ico">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <path d="M14 2v6h6"/>
                  </svg>
                </div>
                <div>
                  <div className="ie-hist-file">{h.file}</div>
                  <div className="ie-hist-meta">{h.date} · {h.period} · {h.size}</div>
                </div>
                <span className="ie-hist-tx">{h.tx} tx</span>
                <div className="ie-hist-act">
                  <button className="ie-btn" title="Revoir"><IcSearch size={12}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {addSourceOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--overlay-scrim)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setAddSourceOpen(false)}>
          <div style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 420,
            boxShadow: "0 24px 60px var(--shadow-modal)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                Ajouter une source
              </div>
              <button onClick={() => setAddSourceOpen(false)} style={{
                width: 28, height: 28, border: "1px solid var(--line)", borderRadius: 7,
                background: "var(--cream-100)", cursor: "pointer", fontSize: 18, display: "flex",
                alignItems: "center", justifyContent: "center", color: "var(--ink-600)",
              }}>×</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-500)", display: "block", marginBottom: 6 }}>Nom de la banque</label>
                <input value={newSourceName} onChange={e => setNewSourceName(e.target.value)}
                       placeholder="ex. Fortuneo, Hello bank…"
                       style={{ width: "100%", padding: "8px 10px", borderRadius: 8, fontSize: 13,
                                border: "1px solid var(--line)", background: "var(--cream-100)",
                                color: "var(--ink-800)", boxSizing: "border-box", outline: "none" }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--ink-500)", display: "block", marginBottom: 6 }}>Format</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {["CSV","PDF","OFX"].map(f => (
                    <button key={f} onClick={() => setNewSourceFmt(f)} style={{
                      padding: "6px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer",
                      border: "1px solid var(--line)",
                      background: newSourceFmt === f ? "var(--amber-100)" : "var(--cream-50)",
                      color: newSourceFmt === f ? "var(--amber-500)" : "var(--ink-700)",
                      borderColor: newSourceFmt === f ? "rgba(184,105,61,0.3)" : "var(--line)",
                    }}>{f}</button>
                  ))}
                </div>
              </div>
              <button onClick={() => {
                if (!newSourceName.trim()) return;
                setUserSources(prev => [...prev, { name: newSourceName.trim(), fmt: newSourceFmt, last: null, status: "new" }]);
                setNewSourceName("");
                setNewSourceFmt("CSV");
                setAddSourceOpen(false);
              }} style={{
                marginTop: 6, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 500,
                background: "var(--amber-500)", color: "var(--cream-50)", border: "none", cursor: "pointer",
              }}>Ajouter la source</button>
            </div>
          </div>
        </div>
      )}

      {histOpen && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200,
          background: "var(--overlay-scrim)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }} onClick={() => setHistOpen(false)}>
          <div style={{
            background: "var(--cream-50)", borderRadius: 16,
            padding: "28px 32px", width: 560,
            boxShadow: "0 24px 60px var(--shadow-modal)",
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 16, fontFamily: "var(--font-display)", color: "var(--ink-900)" }}>
                  Historique des imports
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 3 }}>
                  {importHistory.length} fichier{importHistory.length > 1 ? "s" : ""} importé{importHistory.length > 1 ? "s" : ""}
                </div>
              </div>
              <button onClick={() => setHistOpen(false)} style={{
                width: 28, height: 28, border: "1px solid var(--line)", borderRadius: 7,
                background: "var(--cream-100)", cursor: "pointer", fontSize: 18, display: "flex",
                alignItems: "center", justifyContent: "center", color: "var(--ink-600)",
              }}>×</button>
            </div>
            <div style={{ borderTop: "1px solid var(--line)" }}>
              {importHistory.length === 0 ? (
                <div style={{ padding: "24px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 12 }}>
                  Aucun import enregistré.
                </div>
              ) : importHistory.map((h, idx) => (
                <div key={idx} style={{
                  display: "grid", gridTemplateColumns: "1fr auto",
                  alignItems: "center", gap: 12,
                  padding: "12px 0", borderBottom: "1px dashed var(--line)",
                }}>
                  <div>
                    <div style={{ fontSize: 13, color: "var(--ink-800)", fontWeight: 500 }}>{h.file}</div>
                    <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 2, fontFamily: "var(--font-mono)" }}>
                      {h.date} · {h.tx} transactions · {h.size}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   2. Aperçu — table éditable + récap + règle suggérée
   ───────────────────────────────────────────────────────────────── */
function ImportPreview({ onConfirm, onCancel, txs, fileName, fileSize }) {
  const [catOverrides, setCatOverrides] = useState({});
  const [catPickerRow, setCatPickerRow] = useState(null);
  const [filter, setFilter] = useState("all");

  const allCats = [
    { id: "alim", label: "Alimentation", color: "#b8693d" },
    { id: "loy",  label: "Logement",     color: "#3d2817" },
    { id: "tra",  label: "Transports",   color: "#6b7a4f" },
    { id: "loi",  label: "Loisirs",      color: "#a85a48" },
    { id: "san",  label: "Santé",        color: "#9d8b73" },
    { id: "abo",  label: "Abonnements",  color: "#cd8459" },
    { id: "inc",  label: "Revenus",      color: "#6b7a4f" },
    { id: "epa",  label: "Épargne",      color: "#9d8b73" },
  ];

  // Données réelles si disponibles, sinon mock de démonstration
  const review = txs || [
    { d: "29/04", lbl: "AMAZON EU SARL",         sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "low",  amt: -34.99 },
    { d: "28/04", lbl: "SALAIRE AVRIL",          sub: "VIR ENT — DUPONT SAS", cat: "inc",  conf: "high", amt: +2560.00 },
    { d: "27/04", lbl: "AUCHAN DRIVE",           sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -82.40 },
    { d: "26/04", lbl: "PRLV STORAGE BOX",       sub: "PRELEVEMENT SEPA",     cat: null,   conf: "none", amt: -12.00 },
    { d: "25/04", lbl: "RETRAIT DAB Lyon",       sub: "RETRAIT ESPECES",      cat: null,   conf: "none", amt: -60.00 },
    { d: "24/04", lbl: "SNCF INTERNET",          sub: "PAIEMENT PAR CARTE",   cat: "tra",  conf: "high", amt: -67.00 },
    { d: "23/04", lbl: "BOULANGERIE PICHON",     sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -8.40 },
    { d: "22/04", lbl: "NETFLIX.COM",            sub: "PAIEMENT PAR CARTE",   cat: "abo",  conf: "med",  amt: -13.49 },
    { d: "20/04", lbl: "DR. MARTIN J.",          sub: "VIREMENT SEPA",        cat: "san",  conf: "low",  amt: -55.00 },
    { d: "19/04", lbl: "MONOPRIX RUE DAMPIERRE", sub: "PAIEMENT PAR CARTE",   cat: "alim", conf: "high", amt: -42.10 },
    { d: "17/04", lbl: "LOYER AVRIL",            sub: "VIREMENT SEPA",        cat: "loy",  conf: "high", amt: -920.00 },
    { d: "15/04", lbl: "LE PETIT CAFÉ",          sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "high", amt: -14.20 },
    { d: "12/04", lbl: "TOTAL ÉNERGIES",         sub: "PAIEMENT PAR CARTE",   cat: "tra",  conf: "high", amt: -48.10 },
    { d: "10/04", lbl: "FNAC.COM",               sub: "PAIEMENT PAR CARTE",   cat: "loi",  conf: "med",  amt: -29.90 },
  ];

  const withCat = review.map((t, i) => ({
    ...t,
    cat: catOverrides[i] !== undefined ? catOverrides[i] : t.cat,
  }));

  const noCat   = withCat.filter(t => !t.cat).length;
  const toCheck = withCat.filter(t => t.conf === "low" || t.conf === "none").length;

  const filtered = filter === "all" ? withCat
    : filter === "check" ? withCat.filter(t => t.conf === "low" || t.conf === "none")
    : withCat.filter(t => !t.cat);

  const totalDebit  = withCat.filter(t => t.amt < 0).reduce((s, t) => s + t.amt, 0);
  const totalCredit = withCat.filter(t => t.amt > 0).reduce((s, t) => s + t.amt, 0);

  const catById = Object.fromEntries(allCats.map(c => [c.id, c]));

  const displayName = fileName || "releve-bnp-avril-2026.pdf";
  const displaySize = fileSize ? fmtSize(fileSize) : "318 ko";

  return (
    <main className="ip-main">
      <style>{`
        .ip-main { padding: 22px 28px; display: flex; flex-direction: column;
                   gap: 14px; height: 100%; overflow: hidden;
                   background: var(--page-bg); color: var(--ink-800); font-size: 13px; }
        .ip-top { display: flex; align-items: flex-end; justify-content: space-between; }
        .ip-bread { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em;
                    text-transform: uppercase;
                    display: flex; align-items: center; gap: 6px; }
        .ip-bread strong { color: var(--ink-800); font-weight: 500; letter-spacing: 0; text-transform: none; }
        .ip-bread .crumb-link { color: var(--ink-500); cursor: pointer; }
        .ip-bread .crumb-link:hover { color: var(--amber-500); }
        .ip-h1 { font-family: var(--font-display); font-size: 26px; font-weight: 400;
                 margin: 4px 0 0; color: var(--ink-900); letter-spacing: -0.01em; }
        .ip-h1 .file { font-family: var(--font-mono); font-size: 13px; color: var(--ink-500);
                       margin-left: 10px; font-style: normal; }
        .ip-tool { display: flex; gap: 8px; align-items: center; }
        .ip-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px;
                  border: 1px solid var(--line); border-radius: 8px;
                  background: var(--cream-50); color: var(--ink-700);
                  font-size: 12px; cursor: pointer; }
        .ip-btn.amber { background: var(--amber-500); color: var(--cream-50);
                        border-color: var(--amber-500); font-weight: 500; }
        .ip-btn.ghost { background: transparent; border-color: transparent; color: var(--ink-600); }

        .ip-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .ip-stat { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 12px; padding: 14px 16px; }
        .ip-stat-l { font-size: 11px; color: var(--ink-500); letter-spacing: 0.06em; text-transform: uppercase; }
        .ip-stat-v { font-family: var(--font-display); font-size: 24px;
                     color: var(--ink-900); line-height: 1.1; margin-top: 6px; }
        .ip-stat-s { font-size: 11px; color: var(--ink-500); margin-top: 4px;
                     font-family: var(--font-mono); }

        .ip-cols { display: grid; grid-template-columns: 1.7fr 1fr; gap: 14px;
                   flex: 1; min-height: 0; }
        .ip-card { background: var(--cream-50); border: 1px solid var(--line);
                   border-radius: 14px;
                   display: flex; flex-direction: column; min-height: 0; }
        .ip-card-h { padding: 16px 20px 12px;
                     display: flex; align-items: flex-start; justify-content: space-between;
                     border-bottom: 1px solid var(--line); }
        .ip-card-t { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-card-s { font-size: 11px; color: var(--ink-500); margin-top: 2px; }

        .ip-tabs { display: flex; gap: 4px; }
        .ip-tab { padding: 5px 12px; border-radius: 7px; font-size: 11.5px;
                  color: var(--ink-600); background: transparent;
                  border: 1px solid transparent; cursor: pointer;
                  display: inline-flex; align-items: center; gap: 6px; }
        .ip-tab.active { background: var(--cream-200); color: var(--ink-800); }
        .ip-tab .num { font-family: var(--font-mono); font-size: 10px; color: var(--ink-500); }
        .ip-tab.active .num { color: var(--amber-500); }
        .ip-tab.warn { color: var(--amber-500); }

        .ip-tbody { overflow: auto; flex: 1; }
        .ip-tr { display: grid; grid-template-columns: 28px 60px 1fr 180px 110px;
                 align-items: center; padding: 10px 20px;
                 border-bottom: 1px dashed var(--line);
                 position: relative; gap: 10px; }
        .ip-tr.review { background: rgba(184,105,61,0.04); }
        .ip-tr.review::before { content: ""; position: absolute; left: 0; top: 0; bottom: 0;
                                width: 2px; background: var(--amber-500); }
        .ip-tr.head { padding: 8px 20px; background: var(--cream-100);
                      border-bottom: 1px solid var(--line);
                      font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase;
                      color: var(--ink-500); }
        .ip-cb { width: 14px; height: 14px; border: 1.5px solid var(--line-strong);
                 border-radius: 3.5px; cursor: pointer; }
        .ip-cb.checked { background: var(--amber-500); border-color: var(--amber-500);
                         position: relative; }
        .ip-cb.checked::after { content: ""; position: absolute; left: 3px; top: 1px;
                                width: 4px; height: 7px;
                                border: solid var(--cream-50); border-width: 0 1.5px 1.5px 0;
                                transform: rotate(45deg); }
        .ip-date { font-family: var(--font-mono); font-size: 12px; color: var(--ink-500); }
        .ip-lbl { font-size: 13px; color: var(--ink-800); font-weight: 500; }
        .ip-sub { font-size: 10px; color: var(--ink-500); font-family: var(--font-mono);
                  margin-top: 2px; letter-spacing: 0.04em; text-transform: uppercase; }

        .ip-cat { display: inline-flex; align-items: center; gap: 6px;
                  padding: 4px 8px 4px 10px;
                  border: 1px dashed var(--line-strong); border-radius: 999px;
                  font-size: 11px; cursor: pointer; background: var(--cream-50);
                  position: relative; }
        .ip-cat.solid { border-style: solid; }
        .ip-cat-none { color: var(--amber-500); border-color: rgba(184,105,61,0.4);
                       background: var(--amber-100); }
        .ip-cat-conf { width: 5px; height: 5px; border-radius: 999px; }
        .conf-high { background: var(--sage-500); }
        .conf-med  { background: var(--amber-500); }
        .conf-low  { background: var(--rose-500); }
        .ip-cat-picker { position: absolute; top: calc(100% + 4px); left: 0; z-index: 20;
                         background: var(--cream-50); border: 1px solid var(--amber-500);
                         border-radius: 10px; padding: 6px; min-width: 160px;
                         box-shadow: 0 4px 14px var(--shadow-soft); }
        .ip-cat-picker div { display: flex; align-items: center; gap: 8px; padding: 7px 10px;
                              border-radius: 7px; cursor: pointer; font-size: 12px; }
        .ip-cat-picker div:hover { background: var(--amber-100); }

        .ip-amt { font-family: var(--font-mono); font-size: 13px; text-align: right;
                  color: var(--ink-800); font-weight: 500; }
        .ip-amt.pos { color: var(--sage-500); }

        .ip-recap { display: flex; flex-direction: column; gap: 12px;
                    padding: 16px 20px; flex: 1; min-height: 0; overflow: auto; }
        .ip-recap-row { display: grid; grid-template-columns: 1fr auto auto;
                        align-items: center; gap: 10px;
                        padding: 8px 0; border-bottom: 1px dashed var(--line); }
        .ip-recap-row:last-child { border-bottom: none; }
        .ip-recap-l { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--ink-800); }
        .ip-recap-c { font-family: var(--font-mono); font-size: 11px; color: var(--ink-500); }
        .ip-recap-a { font-family: var(--font-mono); font-size: 12.5px; color: var(--ink-800); font-weight: 500; }

        .ip-rule { padding: 14px; border-radius: 10px; background: var(--amber-100);
                   border: 1px solid rgba(184,105,61,0.25);
                   display: flex; gap: 12px; align-items: flex-start; }
        .ip-rule-ico { width: 28px; height: 28px; border-radius: 50%;
                       background: var(--cream-50);
                       display: flex; align-items: center; justify-content: center;
                       color: var(--amber-500); flex-shrink: 0; }
        .ip-rule-t { font-size: 12px; color: var(--ink-900); font-weight: 500; }
        .ip-rule-s { font-size: 11px; color: var(--ink-700); margin-top: 3px; line-height: 1.4; }
        .ip-rule-actions { display: flex; gap: 6px; margin-top: 8px; }
      `}</style>

      <div className="ip-top">
        <div>
          <div className="ip-bread">
            <span className="crumb-link" onClick={onCancel}>Importer</span>
            <IcArrowR size={10}/>
            <strong>Aperçu</strong>
          </div>
          <h1 className="ip-h1">
            {displayName.replace(/\.[^.]+$/, "").replace(/-/g, " ").replace(/_/g, " ")}
            <span className="file">{displayName} · {displaySize}</span>
          </h1>
        </div>
        <div className="ip-tool">
          <button className="ip-btn ghost" onClick={onCancel}>Annuler</button>
          <button className="ip-btn amber" onClick={onConfirm}>
            <IcArrowR size={14}/>Importer {review.length} transactions
          </button>
        </div>
      </div>

      {/* STATS — calculées depuis les vraies données */}
      <div className="ip-stats">
        <div className="ip-stat">
          <div className="ip-stat-l">Transactions détectées</div>
          <div className="ip-stat-v">{review.length}</div>
          <div className="ip-stat-s">dont {toCheck} à vérifier · {noCat} sans catégorie</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Période</div>
          <div className="ip-stat-v" style={{ fontSize: 18, paddingTop: 4 }}>
            {review[review.length - 1]?.d || "—"} → {review[0]?.d || "—"}
          </div>
          <div className="ip-stat-s">{review.length} lignes importées</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Total débits</div>
          <div className="ip-stat-v" style={{ color: "var(--rose-500)" }}>{fmtEUR(totalDebit, 2)}</div>
          <div className="ip-stat-s">{review.filter(t => t.amt < 0).length} mouvements</div>
        </div>
        <div className="ip-stat">
          <div className="ip-stat-l">Total crédits</div>
          <div className="ip-stat-v" style={{ color: "var(--sage-500)" }}>+{fmtEUR(Math.abs(totalCredit), 2)}</div>
          <div className="ip-stat-s">{review.filter(t => t.amt > 0).length} mouvements</div>
        </div>
      </div>

      {/* TWO COLUMNS */}
      <div className="ip-cols">
        <div className="ip-card" style={{ position: "relative" }}>
          <div className="ip-card-h">
            <div>
              <div className="ip-card-t">Transactions extraites</div>
              <div className="ip-card-s">cliquez sur une catégorie pour la modifier</div>
            </div>
            <div className="ip-tabs">
              <button className={"ip-tab" + (filter === "all" ? " active" : "")}
                      onClick={() => setFilter("all")}>
                Tout <span className="num">{review.length}</span>
              </button>
              <button className={"ip-tab warn" + (filter === "check" ? " active" : "")}
                      onClick={() => setFilter("check")}>
                À vérifier <span className="num">{toCheck}</span>
              </button>
              <button className={"ip-tab" + (filter === "nocat" ? " active" : "")}
                      onClick={() => setFilter("nocat")}>
                Sans catégorie <span className="num">{noCat}</span>
              </button>
            </div>
          </div>
          <div className="ip-tr head">
            <span/>
            <span>Date</span>
            <span>Libellé</span>
            <span>Catégorie suggérée</span>
            <span style={{ textAlign: "right" }}>Montant</span>
          </div>
          <div className="ip-tbody" onClick={() => setCatPickerRow(null)}>
            {filtered.map((t, i) => {
              const origIdx = withCat.indexOf(t);
              const catInfo = t.cat ? (t.cat === "inc"
                ? { label: "Revenus", color: "var(--sage-500)" }
                : catById[t.cat] || null)
                : null;
              const isReview = t.conf === "low" || t.conf === "none";
              return (
                <div key={i} className={"ip-tr" + (isReview ? " review" : "")}>
                  <span className="ip-cb"/>
                  <span className="ip-date">{t.d}</span>
                  <div>
                    <div className="ip-lbl">{t.lbl}</div>
                    {t.sub && <div className="ip-sub">{t.sub}</div>}
                  </div>
                  <div style={{ position: "relative" }}>
                    {catInfo ? (
                      <span className="ip-cat solid"
                            style={{ borderColor: (catInfo.color || "#9d8b73") + "55",
                                     color: catInfo.color || "#9d8b73" }}
                            onClick={e => { e.stopPropagation(); setCatPickerRow(catPickerRow === origIdx ? null : origIdx); }}>
                        <span className={"ip-cat-conf conf-" + t.conf}/>
                        {catInfo.label}<IcChevDn size={10}/>
                      </span>
                    ) : (
                      <span className="ip-cat ip-cat-none"
                            onClick={e => { e.stopPropagation(); setCatPickerRow(catPickerRow === origIdx ? null : origIdx); }}>
                        <IcPlus size={10}/>Choisir<IcChevDn size={10}/>
                      </span>
                    )}
                    {catPickerRow === origIdx && (
                      <div className="ip-cat-picker" onClick={e => e.stopPropagation()}>
                        {allCats.map(c => (
                          <div key={c.id}
                               style={{ color: t.cat === c.id ? "var(--amber-500)" : "var(--ink-800)",
                                        background: t.cat === c.id ? "var(--amber-100)" : undefined }}
                               onClick={() => {
                                 setCatOverrides(prev => ({ ...prev, [origIdx]: c.id }));
                                 setCatPickerRow(null);
                               }}>
                            <span className="amb-dot" style={{ background: c.color }}/>
                            {c.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={"ip-amt" + (t.amt > 0 ? " pos" : "")}>
                    {t.amt > 0 ? "+" : ""}{fmtEUR(t.amt, 2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ip-card">
          <div className="ip-card-h">
            <div>
              <div className="ip-card-t">Récapitulatif</div>
              <div className="ip-card-s">par catégorie suggérée</div>
            </div>
          </div>
          <div className="ip-recap">
            {allCats.map(c => {
              const rows = withCat.filter(t => t.cat === c.id);
              if (rows.length === 0) return null;
              const sum = rows.reduce((s, t) => s + Math.abs(t.amt), 0);
              return (
                <div key={c.id} className="ip-recap-row">
                  <span className="ip-recap-l">
                    <span className="amb-dot" style={{ background: c.color }}/>
                    {c.label}
                  </span>
                  <span className="ip-recap-c">{rows.length} tx</span>
                  <span className="ip-recap-a">{fmtEUR(sum, 0)}</span>
                </div>
              );
            })}
            {noCat > 0 && (
              <div className="ip-recap-row">
                <span className="ip-recap-l" style={{ color: "var(--amber-500)" }}>
                  <span className="amb-dot" style={{ background: "var(--amber-500)" }}/>
                  Sans catégorie
                </span>
                <span className="ip-recap-c">{noCat} tx</span>
                <span className="ip-recap-a">
                  {fmtEUR(withCat.filter(t => !t.cat).reduce((s, t) => s + Math.abs(t.amt), 0), 0)}
                </span>
              </div>
            )}

            <div className="ip-rule">
              <div className="ip-rule-ico">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l2.4 7.4H22l-6 4.6 2.4 7.4-6.4-4.6L5.6 21.4 8 14 2 9.4h7.6z"/>
                </svg>
              </div>
              <div>
                <div className="ip-rule-t">Créer des règles automatiques ?</div>
                <div className="ip-rule-s">
                  Ambre peut mémoriser les libellés récurrents pour classer
                  automatiquement vos prochains relevés.
                </div>
                <div className="ip-rule-actions">
                  <button className="ip-btn" style={{ padding: "5px 12px", fontSize: 11 }}>Plus tard</button>
                  <button className="ip-btn amber" style={{ padding: "5px 12px", fontSize: 11 }}>Configurer</button>
                </div>
              </div>
            </div>
          </div>

          <div style={{ padding: "12px 20px", borderTop: "1px solid var(--line)",
                        display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--sage-500)" }}>
            <IcLock size={11}/>
            Aucune donnée n'a quitté votre appareil.
          </div>
        </div>
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────────────
   3. Succès — confirmation + récap + prochaines étapes
   ───────────────────────────────────────────────────────────────── */
function ImportSuccess({ onAgain, txs, fileName }) {
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

/* ─────────────────────────────────────────────────────────────────
   4. Erreur — message principal + détails + cas fréquents
   ───────────────────────────────────────────────────────────────── */
function ImportError({ onRetry, errorMsg, fileName }) {
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
