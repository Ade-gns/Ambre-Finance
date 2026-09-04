/* ─────────────────────────────────────────────────────────────────
   Parser QIF (Quicken Interchange Format)

   Format ligne à ligne, sans en-tête de colonnes : chaque ligne porte un
   code d'une lettre suivi de sa valeur, et `^` termine l'enregistrement.

     !Type:Bank
     D01/03/2026
     T-8,70
     PBOULANGERIE PICHON
     MPAIEMENT PAR CARTE
     LAlimentation
     ^

   Codes lus : D date · T (ou U) montant · P bénéficiaire · M mémo ·
   L catégorie. Les autres (N° de chèque, statut de pointage, ventilations
   S/E/$…) sont ignorés.

   Un fichier QIF peut aussi contenir des sections qui ne sont pas des
   transactions (!Type:Cat pour la liste des catégories, !Account, blocs
   mémorisés) : elles sont sautées, sinon chaque catégorie déclarée
   deviendrait une fausse transaction.

   Sortie : strictement le format de parseCSV() — { d, lbl, sub, cat, conf, amt }
   ───────────────────────────────────────────────────────────────── */

import { normalizeDate, parseAmt, categorizeTx } from "./csvParser";

// Sections dont les enregistrements sont des transactions.
const TX_SECTIONS = /^!type:(bank|ccard|cash|oth\s*a|oth\s*l|credit\s*card)/i;
// Sections à ignorer explicitement (listes de référence, pas des mouvements).
const NON_TX_SECTION = /^!(type:(cat|class|memorized|prices|security|invst|invoice)|account|option|clear)/i;

const pad = n => String(n).padStart(2, "0");

/**
 * Date QIF. Quicken écrit selon les versions « 01/03/2026 », « 01/03/26 »,
 * « 3/ 1'26 » (espaces de calage, apostrophe pour les années 2000).
 *
 * Le format QIF ne dit pas si l'ordre est JJ/MM ou MM/JJ. On tranche par le
 * seul indice fiable disponible : si le deuxième nombre dépasse 12, c'est
 * forcément un jour, donc l'ordre est MM/JJ et on permute. Sinon on garde
 * JJ/MM, la convention des exports français visés par Ambre. Un fichier
 * américain dont toutes les dates sont ambiguës (jour ≤ 12) sera donc lu en
 * JJ/MM — limite connue, inhérente au format.
 */
function qifDate(raw) {
  const cleaned = (raw || "").replace(/\s+/g, "").replace(/'/g, "/");
  const m = cleaned.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return normalizeDate(cleaned);
  let [, first, second, year] = m;
  if (Number(second) > 12 && Number(first) <= 12) [first, second] = [second, first];
  return normalizeDate(`${pad(first)}/${pad(second)}/${year}`);
}

/** Le fichier ressemble-t-il à du QIF ? (distingue « vide » de « pas un QIF ») */
export function looksLikeQif(rawText) {
  const t = (rawText || "").trim();
  if (!t) return false;
  // Soit une déclaration de section, soit au moins un enregistrement terminé
  // par ^ avec une ligne de montant ou de date.
  return /^!type:/im.test(t) || (/^\^/m.test(t) && /^[DTU]/m.test(t));
}

/**
 * @param {string} rawText contenu du fichier .qif
 * @param {Array}  rules   règles automatiques de l'utilisateur
 * @returns {Array<object>|null} transactions au format parseCSV, ou null
 */
export function parseQIF(rawText, rules = []) {
  const text = (rawText || "").replace(/^\uFEFF/, "");
  if (!looksLikeQif(text)) return null;

  const txs = [];
  let inTxSection = true; // un QIF peut commencer directement par des enregistrements
  let rec = {};

  const flush = () => {
    const record = rec;
    rec = {};
    if (!inTxSection) return;

    const amt = parseAmt(record.T ?? record.U ?? "");
    if (isNaN(amt) || amt === 0) return;

    // P (bénéficiaire) est le libellé naturel ; à défaut le mémo.
    const lbl = (record.P || record.M || "").replace(/\s+/g, " ").trim();
    if (!lbl) return;

    // L porte la catégorie Quicken : « Alimentation », « Cat:Sous-cat », ou
    // « [Compte] » pour un virement interne — dans ce dernier cas ce n'est
    // pas une catégorie de dépense, on ne la propose pas au mapping.
    const rawCat = (record.L || "").trim();
    const bankCat = rawCat.startsWith("[") ? "" : rawCat;

    const memo = (record.M || "").trim();
    const { cat, conf } = categorizeTx(lbl, amt, rules, bankCat);

    txs.push({
      d:   qifDate(record.D || ""),
      lbl,
      sub: memo && memo !== lbl ? memo : bankCat,
      cat,
      conf,
      amt,
    });
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line) continue;

    if (line.startsWith("!")) {
      // Changement de section : l'enregistrement en cours est abandonné.
      rec = {};
      if (TX_SECTIONS.test(line))          inTxSection = true;
      else if (NON_TX_SECTION.test(line))  inTxSection = false;
      continue;
    }

    if (line.startsWith("^")) { flush(); continue; }

    const code = line[0];
    const value = line.slice(1).trim();
    // Un même code peut revenir (mémos sur plusieurs lignes) : on concatène
    // plutôt que d'écraser, sauf pour la date et le montant.
    if ((code === "M" || code === "P") && rec[code]) rec[code] += " " + value;
    else rec[code] = value;
  }
  flush(); // dernier enregistrement si le fichier ne finit pas par ^

  return txs.length > 0 ? txs : null;
}
