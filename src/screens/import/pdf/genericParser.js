// Mode générique — utilisé pour toute banque sans gabarit dédié (voir
// src/screens/import/pdf/banks/), ou en dernier recours si même la
// détection d'en-tête générique échoue.
//
// Deux niveaux :
//  1. Détection d'en-tête générique (vocabulaire français courant) +
//     extraction par colonnes, via columnParser — la même mécanique que les
//     gabarits dédiés, juste sans vocabulaire spécifique à une banque.
//  2. Si aucun en-tête n'est trouvé sur aucune page (mise en page inhabituelle,
//     tableau sans en-tête textuel...) : repli ligne par ligne — toute ligne
//     contenant une date reconnaissable ET un montant reconnaissable devient
//     une transaction candidate, le reste du texte de la ligne devenant le
//     libellé. Moins fiable : signalé à l'utilisateur dans l'aperçu d'import.

import { lineText, isNoiseLine } from "./lineReconstruct";
import { normalizeDate, parseAmt } from "../csvParser";
import { findHeaderRow, extractByColumns } from "./columnParser";

/** Tente l'extraction générique par colonnes (en-tête français courant). */
export function tryGenericColumns(lines) {
  const header = findHeaderRow(lines);
  if (!header) return null;
  const rows = extractByColumns(lines, header);
  return rows.length ? rows : null;
}

// Une date reconnaissable en tout point de la ligne : DD/MM/YYYY, DD/MM/YY,
// DD-MM-YYYY, DD.MM.YYYY.
const DATE_RE = /\b(\d{1,2}[/.-]\d{1,2}[/.-](?:\d{4}|\d{2}))\b/;
// Un montant plausible en fin de ligne : 1.234,56 / 1 234,56 / -12,00 / 12.00€…
const AMOUNT_RE = /([+-]?\(?\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d{2})\)?\s?[€$]?)\s*$/;

/**
 * Dernier recours, purement ligne à ligne (pas de notion de colonnes) :
 * chaque ligne avec une date + un montant devient une transaction, le texte
 * restant devient le libellé.
 */
export function fallbackLineByLine(lines) {
  const out = [];
  for (const line of lines) {
    const text = lineText(line);
    if (!text || isNoiseLine(text)) continue;

    const dateMatch = text.match(DATE_RE);
    if (!dateMatch) continue;
    const d = normalizeDate(dateMatch[1]);
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(d)) continue;

    const amtMatch = text.match(AMOUNT_RE);
    if (!amtMatch) continue;
    const amt = parseAmt(amtMatch[1]);
    if (isNaN(amt) || amt === 0) continue;

    const lblRaw = text
      .slice(0, amtMatch.index)
      .replace(dateMatch[0], " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!lblRaw) continue;

    out.push({ d, lblRaw, amt });
  }
  return out;
}
