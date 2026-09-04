// Registre des gabarits par banque. Interface commune à chaque module de
// src/screens/import/pdf/banks/ :
//   {
//     id: string,               // identifiant court (utilisé pour l'indicateur "gabarit" dans l'aperçu)
//     label: string,             // nom affiché
//     detect(fullText): boolean, // signature caractéristique du relevé (en-tête, mentions légales…)
//     roleKeywords?: object,     // variantes de vocabulaire d'en-tête, fusionnées avec le socle générique
//     noisePatterns?: RegExp[],  // motifs de bruit additionnels propres à cette banque
//   }
//
// Ajouter une banque : créer un fichier ici avec cette forme, puis
// l'enregistrer dans BANKS ci-dessous, dans l'ordre de priorité de détection.
//
// ⚠️ Limite connue : sans relevés réels de ces banques disponibles dans le
// projet, chaque gabarit est un best-effort basé sur les conventions
// publiquement connues des relevés bancaires français (vocabulaire d'en-tête,
// nom de la banque) — vérifié uniquement sur des PDF synthétiques construits
// pour correspondre à ces mêmes hypothèses. Une mise en page réelle qui
// diffère (nouvelle charte, caisse régionale atypique…) peut nécessiter un
// ajustement. Voir le mode générique (genericParser.js) qui prend le relais
// pour toute banque non reconnue.

import { findHeaderRow, extractByColumns, mergeRoleKeywords } from "../columnParser";
import bnpParibas from "./bnpParibas";
import creditAgricole from "./creditAgricole";

export const BANKS = [
  bnpParibas,
  creditAgricole,
];

export function detectBank(fullText) {
  for (const bank of BANKS) {
    if (bank.detect(fullText)) return bank;
  }
  return null;
}

/** Applique le vocabulaire et les motifs de bruit d'une banque au moteur générique. */
export function parseWithBank(bank, lines) {
  const roleKeywords = bank.roleKeywords ? mergeRoleKeywords(bank.roleKeywords) : undefined;
  const header = findHeaderRow(lines, roleKeywords);
  if (!header) return null;
  const rows = extractByColumns(lines, header, bank.noisePatterns || []);
  return rows.length ? rows : null;
}
