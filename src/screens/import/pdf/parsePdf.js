// Orchestrateur : PDF → transactions, au même format de sortie que
// parseCSV() (src/screens/import/csvParser.js) — { d, lbl, sub, cat, conf, amt }
// + `tpl` (id du gabarit banque utilisé, ou "generic") pour que l'aperçu
// d'import puisse signaler les transactions extraites en mode générique.
//
// Ordre d'essai : gabarit de la banque détectée → mode générique par
// colonnes (en-tête standard, banque non reconnue) → dernier recours ligne
// à ligne (aucun en-tête détecté du tout).

import { extractPositionedText, PdfPasswordError } from "./textExtract";
import { groupIntoLines, lineText } from "./lineReconstruct";
import { detectBank, parseWithBank } from "./banks/index";
import { tryGenericColumns, fallbackLineByLine } from "./genericParser";
import { autoCat, applyRules } from "../../../lib/store";

/**
 * @returns {Promise<
 *   { error: "password" | "no-text" | "corrupt" | "no-transactions", detail?: string } |
 *   { transactions: Array<object>, bankId: string|null, tpl: string|null }
 * >}
 */
export async function parsePdfBankStatement(arrayBuffer, rules = []) {
  let pages, hasText;
  try {
    ({ pages, hasText } = await extractPositionedText(arrayBuffer));
  } catch (err) {
    if (err instanceof PdfPasswordError) return { error: "password" };
    return { error: "corrupt", detail: err?.message };
  }
  if (!hasText) return { error: "no-text" };

  const lines = pages.flatMap(p => groupIntoLines(p.items));
  const fullText = lines.map(l => lineText(l)).join("\n");

  const bank = detectBank(fullText);
  let rawRows = null;
  let tpl = null;

  if (bank) {
    rawRows = parseWithBank(bank, lines);
    if (rawRows?.length) tpl = bank.id;
  }
  if (!rawRows?.length) {
    rawRows = tryGenericColumns(lines);
    if (rawRows?.length) tpl = "generic";
  }
  if (!rawRows?.length) {
    rawRows = fallbackLineByLine(lines);
    if (rawRows?.length) tpl = "generic";
  }

  if (!rawRows?.length) return { error: "no-transactions" };

  const transactions = rawRows.map(r => {
    const lbl = r.lblRaw.replace(/\s+/g, " ").trim();
    const ruleCat  = applyRules(rules, lbl);
    const detected = ruleCat || autoCat(lbl, r.amt);
    const finalCat = detected === "aut" ? null : detected;
    const conf     = ruleCat ? "high" : (detected && detected !== "aut") ? "med" : "none";
    return { d: r.d, lbl, sub: "", cat: finalCat, conf, amt: r.amt, tpl };
  });

  return { transactions, bankId: bank?.id || null, tpl };
}
