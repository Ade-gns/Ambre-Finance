import { describe, it, expect } from "vitest";
import { buildTablePdf } from "./__fixtures__/buildTestPdf";
import { extractPositionedText } from "./textExtract";
import { groupIntoLines, lineText } from "./lineReconstruct";
import { detectBank } from "./banks/index";
import { tryGenericColumns, fallbackLineByLine } from "./genericParser";

async function linesFromRows(rows) {
  const bytes = await buildTablePdf(rows);
  const { pages } = await extractPositionedText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  return pages.flatMap(p => groupIntoLines(p.items));
}

const DATE_X = 50, LBL_X = 110, DEBIT_X = 400, CREDIT_X = 470;

describe("tryGenericColumns — banque non reconnue avec en-tête standard", () => {
  it("extrait les transactions via le vocabulaire d'en-tête générique", async () => {
    const lines = await linesFromRows([
      [{ text: "Date", x: DATE_X }, { text: "Libellé", x: LBL_X }, { text: "Débit", x: DEBIT_X }, { text: "Crédit", x: CREDIT_X }],
      [{ text: "01/03/2026", x: DATE_X }, { text: "ACHAT CB", x: LBL_X }, { text: "12,00", x: DEBIT_X }],
    ]);
    const fullText = lines.map(l => lineText(l)).join("\n");
    expect(detectBank(fullText)).toBeNull(); // aucune banque connue mentionnée

    const rows = tryGenericColumns(lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "ACHAT CB", amt: -12 });
  });

  it("retourne null si aucun en-tête n'est détecté", async () => {
    const lines = await linesFromRows([[{ text: "Bonjour, ceci n'est pas un tableau.", x: 50 }]]);
    expect(tryGenericColumns(lines)).toBeNull();
  });
});

describe("fallbackLineByLine — dernier recours sans notion de colonnes", () => {
  it("reconnaît une transaction à partir d'une date et d'un montant en fin de ligne", async () => {
    const lines = await linesFromRows([
      [{ text: "01/03/2026 ACHAT DIVERS SANS TABLEAU 12,50", x: 50 }],
      [{ text: "Mentions légales diverses", x: 50 }],
    ]);
    const rows = fallbackLineByLine(lines);
    expect(rows).toHaveLength(1);
    expect(rows[0].d).toBe("01/03/2026");
    expect(rows[0].amt).toBe(12.5);
    expect(rows[0].lblRaw).toContain("ACHAT DIVERS SANS TABLEAU");
  });

  it("ignore les lignes de bruit même si elles contiennent un nombre", () => {
    const noiseLine = { y: 0, items: [{ text: "Page 1/2", x: 50, y: 0, w: 30, h: 9 }] };
    expect(fallbackLineByLine([noiseLine])).toEqual([]);
  });

  it("ignore les lignes sans date reconnaissable", () => {
    const line = { y: 0, items: [{ text: "Montant total 150,00", x: 50, y: 0, w: 60, h: 9 }] };
    expect(fallbackLineByLine([line])).toEqual([]);
  });
});
