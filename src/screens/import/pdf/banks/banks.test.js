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

  // Cas réel : sur un vrai relevé, une ligne de frais bancaires porte sa
  // propre date et son propre montant, comme n'importe quelle opération. Le
  // test ci-dessus ne le couvrait pas (sa ligne de bruit n'a ni date ni
  // montant) et laissait passer une ligne de frais comme une transaction.
  it("exclut une ligne de bruit qui porte sa propre date et son propre montant", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("01/03/2026", "BOULANGERIE PICHON", { debit: "8,70" }),
      row("05/03/2026", "Cotisation carte Visa Premier", { debit: "12,00" }),
      row("06/03/2026", "VIREMENT DUPONT SAS", { credit: "2 560,00" }),
    ], ["BNP PARIBAS"]);
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(2);
    // La ligne de frais ne doit ni devenir une transaction, ni être recollée
    // au libellé de la transaction précédente.
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

describe("La Banque Postale", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("05/03/2026", "RETRAIT DAB", { debit: "60,00" }),
      row("06/03/2026", "VIREMENT CAF", { credit: "150,00" }),
    ], ["LA BANQUE POSTALE", "Compte Chèques Postal"]);
    expect(bank?.id).toBe("lbp");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ lblRaw: "VIREMENT CAF", amt: 150 });
  });
});

describe("Société Générale", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("07/03/2026", "FNAC.COM", { debit: "29,90" }),
    ], ["SOCIETE GENERALE"]);
    expect(bank?.id).toBe("sg");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "FNAC.COM", amt: -29.9 });
  });
});

describe("Crédit Mutuel", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("08/03/2026", "PHARMACIE CENTRALE", { debit: "15,60" }),
    ], ["CREDIT MUTUEL"]);
    expect(bank?.id).toBe("cm");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "PHARMACIE CENTRALE", amt: -15.6 });
  });
});

describe("CIC", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("09/03/2026", "SNCF CONNECT", { debit: "45,00" }),
    ], ["CIC", "RELEVE DE COMPTE"]);
    expect(bank?.id).toBe("cic");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "SNCF CONNECT", amt: -45 });
  });

  it("n'est pas confondu avec un relevé Crédit Mutuel", async () => {
    const { bank } = await parseStatement(genericHeader, [
      row("09/03/2026", "SNCF CONNECT", { debit: "45,00" }),
    ], ["CREDIT MUTUEL"]);
    expect(bank?.id).toBe("cm");
  });
});

describe("Banque Populaire", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("10/03/2026", "LOYER MARS", { debit: "920,00" }),
    ], ["BANQUE POPULAIRE"]);
    expect(bank?.id).toBe("bp");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "LOYER MARS", amt: -920 });
  });
});

describe("Caisse d'Épargne", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("11/03/2026", "LIVRET A", { credit: "300,00" }),
    ], ["CAISSE D'EPARGNE"]);
    expect(bank?.id).toBe("ce");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "LIVRET A", amt: 300 });
  });
});

describe("LCL", () => {
  it("détecte la banque et extrait les transactions", async () => {
    const { bank, lines } = await parseStatement(genericHeader, [
      row("12/03/2026", "TOTAL ENERGIES", { debit: "61,00" }),
    ], ["LCL", "RELEVE DE COMPTE"]);
    expect(bank?.id).toBe("lcl");
    const rows = parseWithBank(bank, lines);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ lblRaw: "TOTAL ENERGIES", amt: -61 });
  });
});

// Chacune des 9 banques déclare un motif de bruit visant une ligne de frais
// ("cotisation", "frais"…) ou un en-tête répété. Ces lignes portent en
// pratique une date et un montant, donc ce cas doit être couvert pour toutes,
// pas seulement pour BNP Paribas.
const NOISE_WITH_DATE_AND_AMOUNT = [
  { id: "bnp", letterhead: ["BNP PARIBAS"],                       noise: "Cotisation carte Visa Premier" },
  { id: "ca",  letterhead: ["CREDIT AGRICOLE"],                   noise: "Cotisation compte a composer" },
  { id: "lbp", letterhead: ["LA BANQUE POSTALE"],                 noise: "Extrait de compte n 4212" },
  { id: "sg",  letterhead: ["SOCIETE GENERALE"],                  noise: "Frais de tenue de compte" },
  { id: "cic", letterhead: ["CIC", "RELEVE DE COMPTE"],           noise: "Cotisation carte" },
  { id: "cm",  letterhead: ["CREDIT MUTUEL"],                     noise: "Cotisation carte bancaire" },
  { id: "bp",  letterhead: ["BANQUE POPULAIRE"],                  noise: "Cotisation mensuelle" },
  { id: "ce",  letterhead: ["CAISSE D'EPARGNE"],                  noise: "Cotisation formule bouquet" },
  { id: "lcl", letterhead: ["LCL", "RELEVE DE COMPTE"],           noise: "Cotisation carte" },
];

describe("filtrage du bruit daté et chiffré, pour chaque banque", () => {
  it.each(NOISE_WITH_DATE_AND_AMOUNT)(
    "$id — une ligne de bruit avec date et montant n'est pas prise pour une transaction",
    async ({ id, letterhead, noise }) => {
      const { bank, lines } = await parseStatement(genericHeader, [
        row("01/03/2026", "ACHAT REEL", { debit: "10,00" }),
        row("02/03/2026", noise, { debit: "12,00" }),
      ], letterhead);
      expect(bank?.id).toBe(id);
      const rows = parseWithBank(bank, lines);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({ lblRaw: "ACHAT REEL", amt: -10 });
    },
  );
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
