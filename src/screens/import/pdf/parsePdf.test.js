import { describe, it, expect } from "vitest";
import { buildTablePdf, buildEmptyTextPdf } from "./__fixtures__/buildTestPdf";
import { parsePdfBankStatement } from "./parsePdf";

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

async function toArrayBuffer(rowsOrBytes, isBytes) {
  const bytes = isBytes ? rowsOrBytes : await buildTablePdf(rowsOrBytes);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

describe("parsePdfBankStatement", () => {
  it("utilise le gabarit dédié quand la banque est reconnue", async () => {
    const buf = await toArrayBuffer([
      [{ text: "BNP PARIBAS", x: 50 }],
      genericHeader,
      row("01/03/2026", "BOULANGERIE PICHON", { debit: "8,70" }),
      row("02/03/2026", "VIREMENT DUPONT SAS", { credit: "2 560,00" }),
    ]);
    const result = await parsePdfBankStatement(buf);
    expect(result.bankId).toBe("bnp");
    expect(result.tpl).toBe("bnp");
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({ d: "01/03/2026", lbl: "BOULANGERIE PICHON", amt: -8.7 });
    // Chaque transaction porte le gabarit utilisé, pour l'indicateur dans l'aperçu.
    expect(result.transactions.every(t => t.tpl === "bnp")).toBe(true);
  });

  it("bascule en mode générique quand la banque n'est pas reconnue", async () => {
    const buf = await toArrayBuffer([
      genericHeader,
      row("01/03/2026", "ACHAT CB DIVERS", { debit: "12,00" }),
    ]);
    const result = await parsePdfBankStatement(buf);
    expect(result.bankId).toBeNull();
    expect(result.tpl).toBe("generic");
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].tpl).toBe("generic");
  });

  it("catégorise via les règles utilisateur et autoCat comme le CSV", async () => {
    const buf = await toArrayBuffer([
      genericHeader,
      row("01/03/2026", "NETFLIX.COM", { debit: "13,49" }),
    ]);
    const result = await parsePdfBankStatement(buf);
    expect(result.transactions[0].cat).toBe("abo"); // autoCat reconnaît Netflix
  });

  it("signale l'absence de texte extractible (PDF scanné/image)", async () => {
    const bytes = await buildEmptyTextPdf();
    const buf = await toArrayBuffer(bytes, true);
    const result = await parsePdfBankStatement(buf);
    expect(result.error).toBe("no-text");
  });

  it("signale un PDF illisible/corrompu", async () => {
    const buf = new TextEncoder().encode("pas un pdf").buffer;
    const result = await parsePdfBankStatement(buf);
    expect(result.error).toBe("corrupt");
  });

  it("signale l'absence de transaction reconnaissable", async () => {
    const buf = await toArrayBuffer([[{ text: "Un simple paragraphe de texte, sans tableau.", x: 50 }]]);
    const result = await parsePdfBankStatement(buf);
    expect(result.error).toBe("no-transactions");
  });
});
