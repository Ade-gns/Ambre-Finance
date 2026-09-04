// Détection d'un en-tête de tableau (Date / Libellé / Débit / Crédit ou
// Montant) puis extraction des lignes de transaction par alignement en
// colonnes — moteur partagé par le mode générique et par les gabarits par
// banque (qui ne font que fournir un vocabulaire d'en-tête et des motifs de
// bruit spécifiques, voir src/screens/import/pdf/banks/).

import { groupIntoCells, lineText, isNoiseLine } from "./lineReconstruct";
import { normalizeDate, parseAmt } from "../csvParser";

const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();

const DEFAULT_ROLE_KEYWORDS = {
  date:   ["date operation", "date d operation", "date valeur", "date op", "date"],
  lbl:    ["libelle", "operation", "nature de l operation", "designation", "detail de l operation", "communication", "intitule", "detail"],
  debit:  ["debit", "retrait", "sortie"],
  credit: ["credit", "depot", "versement", "entree"],
  amt:    ["montant"],
  balance:["solde"],
};

/** Fusionne des variantes de vocabulaire d'en-tête propres à une banque avec le socle générique. */
export function mergeRoleKeywords(overrides = {}) {
  const merged = {};
  for (const role of new Set([...Object.keys(DEFAULT_ROLE_KEYWORDS), ...Object.keys(overrides)])) {
    merged[role] = [...(overrides[role] || []), ...(DEFAULT_ROLE_KEYWORDS[role] || [])];
  }
  return merged;
}

/**
 * Cherche, parmi les lignes fournies, la première qui ressemble à un en-tête
 * de tableau de transactions et retourne la position (bornes x) de chaque
 * colonne reconnue.
 */
export function findHeaderRow(lines, roleKeywords = DEFAULT_ROLE_KEYWORDS) {
  for (let li = 0; li < lines.length; li++) {
    const cells = groupIntoCells(lines[li]);
    if (cells.length < 2) continue;
    const roles = cells.map(c => {
      const n = norm(c.text);
      for (const [role, kws] of Object.entries(roleKeywords)) {
        if (kws.some(k => n === k || n.includes(k))) return role;
      }
      return null;
    });
    const hasDate = roles.includes("date");
    const hasLbl  = roles.includes("lbl");
    const hasAmt  = roles.includes("amt") || roles.includes("debit") || roles.includes("credit");
    if (hasDate && (hasLbl || hasAmt)) {
      // Bornes de colonne = milieux entre centres de cellules d'en-tête consécutives.
      const bounds = cells.map((c, i) => {
        const prevMid = i === 0 ? -Infinity : (cells[i - 1].xCenter + c.xCenter) / 2;
        const nextMid = i === cells.length - 1 ? Infinity : (c.xCenter + cells[i + 1].xCenter) / 2;
        return { role: roles[i], x0: prevMid, x1: nextMid };
      }).filter(c => c.role);
      return { lineIndex: li, columns: bounds };
    }
  }
  return null;
}

function cellsForColumns(cells, columns) {
  const byRole = {};
  for (const cell of cells) {
    const col = columns.find(c => cell.xCenter >= c.x0 && cell.xCenter < c.x1);
    if (!col) continue;
    byRole[col.role] = byRole[col.role] ? byRole[col.role] + " " + cell.text : cell.text;
  }
  return byRole;
}

/**
 * Extrait les transactions candidates des lignes situées après l'en-tête
 * détecté, en alignant chaque cellule sur la colonne la plus proche.
 * Les lignes sans date reconnaissable dans la colonne date sont traitées
 * comme la suite du libellé de la transaction précédente (libellés
 * multi-lignes, très courants sur les relevés PDF).
 *
 * @returns {Array<{ d: string, lblRaw: string, amt: number }>}
 */
export function extractByColumns(lines, header, extraNoisePatterns = []) {
  const { columns } = header;
  const out = [];
  let current = null;

  for (const line of lines) {
    const cells = groupIntoCells(line);
    if (!cells.length) continue;
    const text = lineText(line, cells);
    const byRole = cellsForColumns(cells, columns);

    // Le bruit est écarté avant toute autre décision : une ligne de frais
    // bancaires porte normalement sa propre date et son propre montant, et
    // serait donc prise pour une transaction si on ne la testait que dans les
    // branches « pas de date » / « pas de montant ».
    // On teste aussi la cellule libellé isolément : les motifs sont ancrés sur
    // le début du libellé (/^cotisation carte/…) alors que le texte complet de
    // la ligne, lui, commence par la date.
    if (isNoiseLine(text, extraNoisePatterns)) continue;
    if (byRole.lbl && isNoiseLine(byRole.lbl, extraNoisePatterns)) continue;

    const dateVal = byRole.date ? normalizeDate(byRole.date) : "";
    const validDate = /^\d{2}\/\d{2}\/\d{4}$/.test(dateVal);

    if (!validDate) {
      // Pas de date sur cette ligne : continuation du libellé de la
      // transaction en cours (libellés multi-lignes).
      if (current && byRole.lbl) current.lblRaw += " " + byRole.lbl;
      continue;
    }

    // Nouvelle ligne de transaction potentielle.
    let amt = NaN;
    if (byRole.amt !== undefined) {
      amt = parseAmt(byRole.amt);
    } else {
      const deb = byRole.debit !== undefined ? parseAmt(byRole.debit) : NaN;
      const cred = byRole.credit !== undefined ? parseAmt(byRole.credit) : NaN;
      const dv = isNaN(deb) ? 0 : Math.abs(deb);
      const cv = isNaN(cred) ? 0 : Math.abs(cred);
      if (cv !== 0) amt = cv;
      else if (dv !== 0) amt = -dv;
    }

    if (isNaN(amt) || amt === 0) {
      // Une date sans montant exploitable : probablement une ligne de solde
      // ou une continuation — on ignore plutôt que de fabriquer une transaction.
      if (current && byRole.lbl) current.lblRaw += " " + byRole.lbl;
      continue;
    }

    current = { d: dateVal, lblRaw: byRole.lbl || "", amt };
    out.push(current);
  }

  return out.filter(t => t.lblRaw.trim());
}
