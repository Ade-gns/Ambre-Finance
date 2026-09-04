import { describe, it, expect } from "vitest";
import { buildTablePdf } from "./__fixtures__/buildTestPdf";
import { extractPositionedText } from "./textExtract";
import { groupIntoLines } from "./lineReconstruct";
import { findHeaderRow, extractByColumns, mergeRoleKeywords } from "./columnParser";

async function linesFromRows(rows, opts) {
  const bytes = await buildTablePdf(rows, opts);
  const { pages } = await extractPositionedText(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  return pages.flatMap(p => groupIntoLines(p.items));
}

const DATE_X = 50, LBL_X = 110, DEBIT_X = 400, CREDIT_X = 470;

function row(date, lbl, { debit, credit } = {}) {
  const cells = [{ text: date, x: DATE_X }, { text: lbl, x: LBL_X }];
  if (debit)  cells.push({ text: debit,  x: DEBIT_X });
  if (credit) cells.push({ text: credit, x: CREDIT_X });
  return cells;
}

describe("findHeaderRow + extractByColumns — colonnes Débit/Crédit séparées", () => {
  it("détecte l'en-tête et extrait les transactions avec le bon signe", async () => {
    const lines = await linesFromRows([
      row("Date", "Libellé", { debit: "Débit", credit: "Crédit" }),
      row("01/03/2026", "BOULANGERIE PICHON", { debit: "8,70" }),
      row("02/03/2026", "VIREMENT DUPONT SAS", { credit: "2 560,00" }),
      row("Solde au 31/03/2026", "", { credit: "1 234,56" }), // doit être ignoré (bruit)
    ]);

    const header = findHeaderRow(lines);
    expect(header).not.toBeNull();
    expect(header.columns.map(c => c.role).sort()).toEqual(["credit", "date", "debit", "lbl"]);

    const rows = extractByColumns(lines, header);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ d: "01/03/2026", lblRaw: "BOULANGERIE PICHON", amt: -8.7 });
    expect(rows[1]).toMatchObject({ d: "02/03/2026", lblRaw: "VIREMENT DUPONT SAS", amt: 2560 });
  });

  it("rattache une ligne de libellé multi-ligne à la transaction précédente", async () => {
    const lines = await linesFromRows([
      row("Date", "Libellé", { debit: "Débit", credit: "Crédit" }),
      row("05/03/2026", "PRLV SEPA", { debit: "42,00" }),
      [{ text: "Réf. abonnement mensuel", x: LBL_X }], // continuation, pas de date
    ]);
    const header = findHeaderRow(lines);
    const rows = extractByColumns(lines, header);
    expect(rows).toHaveLength(1);
    expect(rows[0].lblRaw).toBe("PRLV SEPA Réf. abonnement mensuel");
  });
});

describe("findHeaderRow — colonne Montant unique signée", () => {
  it("détecte l'en-tête Montant et lit le signe du montant", async () => {
    const lines = await linesFromRows([
      [{ text: "Date", x: DATE_X }, { text: "Libellé", x: LBL_X }, { text: "Montant", x: DEBIT_X }],
      [{ text: "10/03/2026", x: DATE_X }, { text: "SNCF INTERNET", x: LBL_X }, { text: "-67,00", x: DEBIT_X }],
      [{ text: "11/03/2026", x: DATE_X }, { text: "SALAIRE", x: LBL_X }, { text: "2560,00", x: DEBIT_X }],
    ]);
    const header = findHeaderRow(lines);
    expect(header.columns.map(c => c.role).sort()).toEqual(["amt", "date", "lbl"]);
    const rows = extractByColumns(lines, header);
    expect(rows).toHaveLength(2);
    expect(rows[0].amt).toBe(-67);
    expect(rows[1].amt).toBe(2560);
  });
});

describe("mergeRoleKeywords", () => {
  it("ajoute des variantes de vocabulaire sans perdre le socle générique", () => {
    const merged = mergeRoleKeywords({ lbl: ["nature operation"] });
    expect(merged.lbl).toContain("nature operation");
    expect(merged.lbl).toContain("libelle"); // socle générique conservé
    expect(merged.date).toContain("date"); // rôles non surchargés inchangés
  });
});

describe("findHeaderRow — absence d'en-tête", () => {
  it("retourne null si aucune ligne ne ressemble à un en-tête", async () => {
    const lines = await linesFromRows([
      [{ text: "Ceci n'est pas un tableau", x: 50 }],
    ]);
    expect(findHeaderRow(lines)).toBeNull();
  });
});
