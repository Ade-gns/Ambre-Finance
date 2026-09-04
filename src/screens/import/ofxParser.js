/* ─────────────────────────────────────────────────────────────────
   Parser OFX (Open Financial Exchange)

   Deux dialectes coexistent dans les exports bancaires, et ce parser
   accepte les deux sans distinction :
   · OFX 1.x — SGML, le dialecte de loin le plus courant chez les banques
     françaises. Les balises « feuilles » n'y sont PAS fermées :
     `<NAME>BOULANGERIE PICHON` se termine au retour à la ligne ou à la
     balise suivante. Seules les balises conteneur (<STMTTRN>, <OFX>…)
     le sont.
   · OFX 2.x — XML bien formé, toutes les balises fermées.

   Plutôt qu'un vrai parseur SGML/XML, on isole les blocs <STMTTRN> puis on
   lit chaque champ avec une expression qui s'arrête au premier `<` ou au
   retour à la ligne — ce qui couvre les deux dialectes avec le même code.

   Sortie : strictement le format de parseCSV() — { d, lbl, sub, cat, conf, amt }
   ───────────────────────────────────────────────────────────────── */

import { normalizeDate, parseAmt, categorizeTx } from "./csvParser";

/**
 * Valeur d'une balise feuille OFX, fermée (`<TAG>v</TAG>`) ou non (`<TAG>v`).
 * La capture s'arrête au premier `<` ou en fin de ligne, ce qui convient
 * aux deux dialectes.
 */
function field(block, tag) {
  const m = block.match(new RegExp(`<${tag}>\\s*([^<\\r\\n]*)`, "i"));
  return m ? m[1].trim() : "";
}

/**
 * Date OFX : YYYYMMDD, éventuellement suivie d'une heure et d'un fuseau
 * (20260301120000.000[-5:EST]) — seule la partie calendaire nous intéresse.
 */
function ofxDate(raw) {
  const m = (raw || "").trim().match(/^(\d{4})(\d{2})(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return normalizeDate(raw); // export non conforme : on tente le parsing générique
}

/** Le fichier ressemble-t-il à de l'OFX ? (sert à distinguer « vide » de « pas un OFX ») */
export function looksLikeOfx(rawText) {
  return /<OFX>|OFXHEADER|<STMTTRN>/i.test(rawText || "");
}

/**
 * @param {string} rawText contenu du fichier .ofx
 * @param {Array}  rules   règles automatiques de l'utilisateur
 * @returns {Array<object>|null} transactions au format parseCSV, ou null
 */
export function parseOFX(rawText, rules = []) {
  const text = (rawText || "").replace(/^\uFEFF/, ""); // strip BOM
  if (!looksLikeOfx(text)) return null;

  // Découpe par <STMTTRN> plutôt que par paire ouvrante/fermante : si un
  // export omet </STMTTRN>, le bloc court simplement jusqu'au suivant. On
  // coupe aussi sur </BANKTRANLIST> pour que le dernier bloc n'avale pas le
  // solde de clôture qui suit.
  const blocks = text.split(/<STMTTRN>/i).slice(1)
    .map(b => b.split(/<\/STMTTRN>|<\/BANKTRANLIST>/i)[0]);

  const txs = [];
  for (const block of blocks) {
    const amt = parseAmt(field(block, "TRNAMT"));
    if (isNaN(amt) || amt === 0) continue;

    const name = field(block, "NAME");
    const memo = field(block, "MEMO");
    const type = field(block, "TRNTYPE");
    // Certaines banques laissent NAME vide et mettent tout dans MEMO ;
    // en dernier recours le type d'opération vaut mieux qu'un libellé vide.
    const lbl = (name || memo || type).replace(/\s+/g, " ").trim();
    if (!lbl) continue;

    // MEMO ne devient un sous-titre que s'il apporte autre chose que le libellé.
    const sub = memo && memo !== lbl ? memo : type;

    const { cat, conf } = categorizeTx(lbl, amt, rules);

    txs.push({ d: ofxDate(field(block, "DTPOSTED")), lbl, sub, cat, conf, amt });
  }

  return txs.length > 0 ? txs : null;
}
