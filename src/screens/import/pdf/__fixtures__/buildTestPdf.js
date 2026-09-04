// Générateur de PDF synthétiques pour les tests — utilise pdf-lib (devDependency
// uniquement, jamais embarqué dans le build de l'app) pour construire des PDF
// avec du texte positionné à des coordonnées x/y précises, imitant la mise en
// page d'un relevé bancaire réel (colonnes alignées) sans dépendre d'un vrai
// fichier de banque.

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_W = 595; // A4 portrait, en points
const PAGE_H = 842;

/**
 * @param {Array<Array<{ text: string, x: number }>>} rows lignes de cellules,
 *   une ligne par ligne de tableau, une entrée par cellule avec sa position x.
 * @param {{ startY?: number, lineGap?: number, fontSize?: number }} [opts]
 */
export async function buildTablePdf(rows, opts = {}) {
  const { startY = 780, lineGap = 16, fontSize = 9 } = opts;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = startY;

  for (const row of rows) {
    if (y < 40) { page = doc.addPage([PAGE_W, PAGE_H]); y = startY; }
    for (const cell of row) {
      page.drawText(cell.text, { x: cell.x, y, size: fontSize, font, color: rgb(0, 0, 0) });
    }
    y -= lineGap;
  }

  return doc.save();
}

/** Un PDF valide mais sans aucun texte (page blanche) — simule un scan/image. */
export async function buildEmptyTextPdf() {
  const doc = await PDFDocument.create();
  doc.addPage([PAGE_W, PAGE_H]);
  return doc.save();
}
