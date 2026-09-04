import { describe, it, expect } from "vitest";
import { buildTablePdf } from "../__fixtures__/buildTestPdf";
import { extractPositionedText } from "../textExtract";
import { groupIntoLines, lineText } from "../lineReconstruct";
import { detectBank, parseWithBank, BANKS } from "./index";

async function parseStatement(headerLine, rows, letterheadLines = []) {
  const bytes = await buildTablePdf([
    ...letterheadLines.map(t => [{ text: t, x: 50 }]),
    headerLine,
    ...rows,
  ]);
  const { pages } = await extractPositionedText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const lines = pages.flatMap(p => groupIntoLines(p.items));
  const fullText = lines.map(l => lineText(l)).join("\n");
  const bank = detectBank(fullText);
  return { bank, lines };
}

const DATE_X = 50, LBL_X = 110, DEBIT_X = 400, CREDIT_X = 470;
const genericHeader = [
  { text: "Date", x: DATE_X }, { text: "Libellé", x: LBL_X },
  { text: "Débit", x: DEBIT_X }, { text: "Crédit", x: CREDIT_X },
];
const row = (date, lbl, { debit, credit } = {}) => {
  const cells = [{ text: date, x: DATE_X }, { text: lbl, x: LBL_X }];
  if (debit)  cells.push({ text: debit,  x: DEBIT_X });
  if (credit) cells.push({ text: credit, x: CREDIT_X });
  return cells;
};

describe("registre des banques", () => {
  it("ne détecte aucune banque sur un relevé neutre", async () => {
    const { bank } = await parseStatement(genericHeader, [
      row("01/03/2026", "ACHAT DIVERS", { debit: "10,00" }),
    ]);
    expect(bank).toBeNull();
  });
});

describe("BNP Paribas", () => {
  it("détecte la banque depuis l'en-tête du relevé", async () => {
    const { bank } = await parseStatement(genericHeader, [
      row("01/03/2026", "BOULANGERIE", { debit: "8,70" }),
    ], ["BNP PARIBAS", "RELEVE DE COMPTE"]);
    expect(bank?.id).toBe("bnp");
  });

  it("extrait les transactions et filtre le bruit propre à la banque", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("01/03/2026", "BOULANGERIE PICHON", { debit: "8,70" }),
      row("02/03/2026", "VIREMENT DUPONT SAS", { credit: "2 560,00" }),
      [{ text: "Cotisation carte Visa Premier", x: LBL_X }],
    ], ["BNP PARIBAS"]);
    expect(bank?.id).toBe("bnp");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ lblRaw: "BOULANGERIE PICHON", amt: -8.7 });
    expect(rows[1]).toMatchObject({ lblRaw: "VIREMENT DUPONT SAS", amt: 2560 });
  });
});

describe("Crédit Agricole", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("03/03/2026", "CARREFOUR MARKET", { debit: "42,10" }),
      row("04/03/2026", "VIR SEPA RECU", { credit: "300,00" }),
    ], ["CREDIT AGRICOLE", "Caisse régionale d'Ile-de-France"]);
    expect(bank?.id).toBe("ca");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ lblRaw: "CARREFOUR MARKET", amt: -42.1 });
  });
});

describe("cohérence du registre", () => {
  it("chaque banque a un id, un label et une fonction detect", () => {
    for (const bank of BANKS) {
      expect(typeof bank.id).toBe("string");
      expect(typeof bank.label).toBe("string");
      expect(typeof bank.detect).toBe("function");
    }
  });

  it("les id sont uniques", () => {
    const ids = BANKS.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
