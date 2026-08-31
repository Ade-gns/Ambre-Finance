import { autoCat, applyRules } from "../../lib/store";

/* ─────────────────────────────────────────────────────────────────
   Parser CSV universel
   · séparateurs : ; , \t |
   · encodages   : UTF-8 (avec/sans BOM) + ISO-8859-1
   · montants    : format européen 1.234,56 · US 1,234.56 ·
                   espace milliers 1 234,56 · parenthèses (150,00) ·
                   symboles €$£
   · dates       : YYYY-MM-DD · DD/MM/YYYY · DD-MM-YY · « 20 Jan 2026 »
   · métadonnées : saute jusqu'à 15 lignes pour trouver l'en-tête
   · statuts     : filtre FAILED/PENDING/REVERTED (Revolut…)
   ───────────────────────────────────────────────────────────────── */

// Découpe une ligne CSV en tenant compte des guillemets et de "" (guillemet échappé)
function parseCsvRow(row, sep) {
  const cells = [];
  let field = "";
  let inQ = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQ && row[i + 1] === '"') { field += '"'; i++; } // "" → guillemet littéral
      else { inQ = !inQ; }
    } else if (ch === sep && !inQ) {
      cells.push(field.trim()); field = "";
    } else {
      field += ch;
    }
  }
  cells.push(field.trim());
  return cells;
}

// Détecte le séparateur en ignorant le contenu entre guillemets (sur 6 lignes)
function detectSeparator(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim()).slice(0, 6);
  const counts = { ";": 0, "\t": 0, "|": 0, ",": 0 };
  for (const line of lines) {
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (!inQ && counts[ch] !== undefined) counts[ch]++;
    }
  }
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return best[1] > 0 ? best[0] : ",";
}

// Normalise un en-tête : minuscules, sans accents, sans guillemets ni underscores
const normHeader = s =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
   .replace(/[_"]/g, " ").replace(/\s+/g, " ").trim();

function normalizeDate(raw) {
  if (!raw || !raw.trim()) return "";
  const MONTHS_FR = ["jan","fev","mar","avr","mai","jun","jul","aou","sep","oct","nov","dec"];
  const MONTHS_EN = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
  // Extraire uniquement la partie date si le champ contient aussi une heure (2024-01-15 10:23:45)
  const dateOnly = raw.trim().split(/[\sT]/)[0];
  let d = dateOnly.replace(/[.-]/g, "/");
  const curYear = new Date().getFullYear();
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(d)) return d.slice(8) + "/" + d.slice(5, 7) + "/" + d.slice(0, 4);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) return d;
  if (/^\d{2}\/\d{2}\/\d{2}$/.test(d))  return d.slice(0, 6) + "20" + d.slice(6);
  if (/^\d{2}\/\d{2}$/.test(d))          return d + "/" + curYear;
  // "20 Jan 2026" / "20-Jan-2026" / "20 janvier 2026"
  const m = raw.trim().match(/^(\d{1,2})[\s\-/]([a-zA-Zéûôèà]{3,})[\s\-/](\d{2,4})$/i);
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

const SKIP_LABELS  = /^(solde|total|balance|report|a nouveau|cumul|sous.total|starting balance|ending balance)/i;
const SKIP_STATES  = new Set(["failed","reverted","declined","pending","cancelled","annule","refuse"]);

// Parsing robuste des montants : format européen, US, parenthèses, symboles monétaires
function parseAmt(raw) {
  if (!raw || !raw.trim()) return NaN;
  let s = raw.trim();
  // Parenthèses = négatif : (150,00) → -150.00
  let forceNeg = false;
  if (s.startsWith("(") && s.endsWith(")")) { forceNeg = true; s = s.slice(1, -1); }
  // Supprimer symboles monétaires et espaces (séparateurs de milliers)
  s = s.replace(/[€$£¥\s]/g, "");
  if (!s) return NaN;
  const lastDot   = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    // Les deux présents : le dernier est la décimale
    if (lastComma > lastDot) {
      s = s.replace(/\./g, "").replace(",", "."); // européen 1.234,56
    } else {
      s = s.replace(/,/g, "");                    // US 1,234.56
    }
  } else if (lastComma !== -1) {
    // Seulement une virgule : décimale si ≤ 2 chiffres après, sinon milliers
    const afterComma = s.slice(lastComma + 1).replace(/\D/g, "");
    s = afterComma.length <= 2 ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  s = s.replace(/[^0-9.\-+]/g, "");
  const v = parseFloat(s);
  if (isNaN(v)) return NaN;
  return forceNeg && v > 0 ? -v : v;
}

// Mapping des catégories bancaires → IDs Ambre
const BANK_CAT_MAP = {
  alim: ["alim", "course", "alimentation", "epicerie", "supermarch", "hypermarche", "grocery", "food"],
  loy:  ["logement", "loyer", "rent", "housing"],
  tra:  ["transport", "navigo", "vtc", "taxi", "parking", "stationnement", "auto", "peage", "transit", "uber", "lyft"],
  loi:  ["loisir", "restaurant", "bar", "cafe", "jeu", "voyage", "shopping", "vetement", "livraison", "achat", "dining", "entertainment"],
  san:  ["sante", "pharma", "medecin", "sport", "salle", "fitness", "hygiene", "health", "pharmacy"],
  abo:  ["abo", "streaming", "telephone", "internet", "mobile", "numerique", "subscription"],
  inc:  ["revenu", "salaire", "aide", "allocation", "caf", "salary", "income", "payroll"],
  epa:  ["epargne", "livret", "pel", "cloture", "saving"],
};

function mapBankCat(raw) {
  if (!raw) return null;
  const n = raw.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [id, kws] of Object.entries(BANK_CAT_MAP)) {
    if (kws.some(k => n.includes(k))) return id;
  }
  return null;
}

export function simplifyLabel(lbl) {
  return (lbl || "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/\d+[,.\d]*/g, " ")
    .replace(/[*#@!_.,;:'"()[\]/\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .split(" ")
    .filter(w => w.length > 2)
    .slice(0, 3)
    .join(" ");
}

export function parseCSV(rawText, rules = []) {
  const text = rawText.replace(/^\uFEFF/, ""); // strip BOM
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  const sep = detectSeparator(text);

  // ── Trouver la ligne d'en-tête (sauter métadonnées bancaires, max 15 lignes) ──
  let headerIdx = -1;
  for (let i = 0; i < Math.min(lines.length - 1, 15); i++) {
    const cells = parseCsvRow(lines[i], sep).map(normHeader);
    const hasDate = cells.some(c => c.includes("date") || c.includes("jour"));
    const hasAmt  = cells.some(c =>
      c.includes("montant") || c.includes("amount") || c.includes("somme") ||
      c.includes("debit")   || c.includes("credit") || c.includes("retrait") ||
      c.includes("entree")  || c.includes("sortie")  || c.includes("solde") ||
      c.includes("deposit") || c.includes("withdrawal"));
    const hasLbl  = cells.some(c =>
      c.includes("libel")  || c.includes("descri")  || c.includes("label")  ||
      c.includes("intitul")|| c.includes("wording") || c.includes("motif")  ||
      c.includes("nom")    || c.includes("name")    || c.includes("payee")  ||
      c.includes("tiers")  || c.includes("merchant")|| c.includes("reference"));
    if ((hasDate && hasAmt) || (hasDate && hasLbl) || (hasLbl && hasAmt)) {
      headerIdx = i; break;
    }
  }
  if (headerIdx === -1) return null;

  const header = parseCsvRow(lines[headerIdx], sep).map(normHeader);
  const idx = (kws) => header.findIndex(c => kws.some(k => c.includes(k)));

  // ── Détection des colonnes ──
  // Préfère date_operation (date op) sur date_compta (date) ; "operation" seul retiré
  // car il matche "date_operation" → utiliser des préfixes distincts
  const dateIdx  = idx(["date op", "date val", "started date", "completed date", "date", "jour"]);
  const lblIdx   = idx(["libel", "descri", "label", "intitul", "wording", "payee",
                         "tiers", "contrepartie", "beneficiar", "merchant",
                         "nom", "name", "reference", "motif"]);
  const amtIdx   = idx(["montant", "amount", "somme"]);
  const debIdx   = idx(["debit", "retrait", "sortie", "depense", "withdrawal"]);
  const credIdx  = idx(["credit", "entree", "encaissement", "versement", "depot", "deposit"]);
  const catIdx   = idx(["categorie", "category"]);
  const subIdx   = idx(["type", "detail", "info", "complement", "communication", "transaction type", "payment reference"]);
  const stateIdx = idx(["state", "statut", "etat", "status"]);

  // Fallback label : première colonne qui n'est ni date ni montant
  let eLblIdx = lblIdx;
  if (eLblIdx === -1) {
    const reserved = new Set([dateIdx, amtIdx, debIdx, credIdx, catIdx, subIdx, stateIdx].filter(i => i !== -1));
    for (let i = 0; i < header.length; i++) {
      if (!reserved.has(i)) { eLblIdx = i; break; }
    }
    if (eLblIdx === -1) eLblIdx = Math.min(1, header.length - 1);
  }

  const eDateIdx = dateIdx !== -1 ? dateIdx : 0;

  // Pas assez d'informations pour extraire des transactions
  if (amtIdx === -1 && debIdx === -1 && credIdx === -1) return null;

  const txs = [];
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const cells = parseCsvRow(lines[i], sep);
    if (cells.length < 2) continue;

    // Ignorer les transactions non finalisées (Revolut, N26…)
    if (stateIdx !== -1) {
      const st = (cells[stateIdx] || "").toLowerCase().trim();
      if (SKIP_STATES.has(st)) continue;
    }

    const lbl = (cells[eLblIdx] || "").replace(/"/g, "").trim();
    if (!lbl) continue;
    if (SKIP_LABELS.test(normHeader(lbl))) continue;

    let amt = NaN;
    if (amtIdx !== -1) {
      amt = parseAmt(cells[amtIdx]);
    } else {
      const deb  = debIdx  !== -1 ? parseAmt(cells[debIdx])  : NaN;
      const cred = credIdx !== -1 ? parseAmt(cells[credIdx]) : NaN;
      const dv = isNaN(deb)  ? 0 : deb;
      const cv = isNaN(cred) ? 0 : cred;
      if      (cv !== 0)  amt = Math.abs(cv);           // colonne crédit → positif
      else if (dv !== 0)  amt = -Math.abs(dv);          // colonne débit  → négatif
    }
    if (isNaN(amt) || amt === 0) continue;

    const bankCat      = catIdx !== -1 ? (cells[catIdx] || "").replace(/"/g, "").trim() : "";
    const bankMappedCat = mapBankCat(bankCat);
    const ruleCat      = bankMappedCat ? null : applyRules(rules, lbl);
    const detected     = bankMappedCat || ruleCat || autoCat(lbl, amt);
    const finalCat     = detected === "aut" ? null : detected;
    const conf         = bankMappedCat ? "high" : ruleCat ? "high" : (detected && detected !== "aut") ? "med" : "none";

    txs.push({
      d:    normalizeDate(cells[eDateIdx] || ""),
      lbl,
      sub:  subIdx !== -1 ? (cells[subIdx] || "").replace(/"/g, "").trim() : bankCat,
      cat:  finalCat,
      conf,
      amt,
    });
  }
  return txs.length > 0 ? txs : null;
}

export function fmtSize(bytes) {
  if (bytes < 1024) return bytes + " o";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " ko";
  return (bytes / (1024 * 1024)).toFixed(1) + " Mo";
}

