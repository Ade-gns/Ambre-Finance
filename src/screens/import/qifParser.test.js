import { describe, it, expect } from "vitest";
import { parseQIF, looksLikeQif } from "./qifParser";

const QIF_BANK = `!Type:Bank
D01/03/2026
T-8,70
PBOULANGERIE PICHON
MPAIEMENT PAR CARTE
LAlimentation
^
D15/03/2026
T2560.00
PVIREMENT DUPONT SAS
LRevenus
^
D20/03/2026
T-13,49
PNETFLIX.COM
^`;

describe("looksLikeQif", () => {
  it("reconnaît un QIF à sa déclaration de section", () => {
    expect(looksLikeQif(QIF_BANK)).toBe(true);
  });

  it("reconnaît un QIF sans en-tête mais avec des enregistrements", () => {
    expect(looksLikeQif("D01/03/2026\nT-10,00\nPACHAT\n^")).toBe(true);
  });

  it("rejette ce qui n'est pas du QIF", () => {
    expect(looksLikeQif("Date;Libellé;Montant\n01/03/2026;ACHAT;-10,00")).toBe(false);
    expect(looksLikeQif("")).toBe(false);
  });
});

describe("parseQIF", () => {
  it("extrait dates, libellés, mémos et montants signés", () => {
    const txs = parseQIF(QIF_BANK);
    expect(txs).toHaveLength(3);
    expect(txs[0]).toMatchObject({
      d: "01/03/2026", lbl: "BOULANGERIE PICHON", sub: "PAIEMENT PAR CARTE", amt: -8.7,
    });
    expect(txs[1]).toMatchObject({ d: "15/03/2026", lbl: "VIREMENT DUPONT SAS", amt: 2560 });
    expect(txs[2]).toMatchObject({ d: "20/03/2026", lbl: "NETFLIX.COM", amt: -13.49 });
  });

  it("mappe la catégorie Quicken (L) sur une catégorie Ambre", () => {
    const txs = parseQIF(QIF_BANK);
    expect(txs[0]).toMatchObject({ cat: "alim", conf: "high" });
    expect(txs[1]).toMatchObject({ cat: "inc", conf: "high" });
  });

  it("retombe sur autoCat quand aucune catégorie n'est fournie", () => {
    const txs = parseQIF(QIF_BANK);
    expect(txs[2]).toMatchObject({ cat: "abo", conf: "med" });
  });

  it("prend le dernier enregistrement même sans ^ final", () => {
    const txs = parseQIF("!Type:Bank\nD01/03/2026\nT-5,00\nPSANS TERMINATEUR");
    expect(txs).toHaveLength(1);
    expect(txs[0].lbl).toBe("SANS TERMINATEUR");
  });

  it("accepte U comme montant quand T est absent", () => {
    const txs = parseQIF("!Type:Bank\nD01/03/2026\nU-42,10\nPMONOPRIX\n^");
    expect(txs[0].amt).toBe(-42.1);
  });

  it("retombe sur le mémo quand il n'y a pas de bénéficiaire", () => {
    const txs = parseQIF("!Type:Bank\nD01/03/2026\nT-12,00\nMPRLV STORAGE BOX\n^");
    expect(txs[0].lbl).toBe("PRLV STORAGE BOX");
  });

  it("ignore les enregistrements sans montant exploitable", () => {
    const txs = parseQIF(`!Type:Bank
D01/03/2026
T0,00
PREGULARISATION
^
D02/03/2026
PSANS MONTANT
^
D03/03/2026
T-5,00
PREEL
^`);
    expect(txs).toHaveLength(1);
    expect(txs[0].lbl).toBe("REEL");
  });

  // Sans ce filtrage, chaque catégorie déclarée en tête de fichier
  // deviendrait une fausse transaction.
  it("ignore les sections qui ne sont pas des transactions", () => {
    const txs = parseQIF(`!Type:Cat
NAlimentation
E
^
NSalaire
I
^
!Type:Bank
D01/03/2026
T-8,70
PBOULANGERIE
^`);
    expect(txs).toHaveLength(1);
    expect(txs[0].lbl).toBe("BOULANGERIE");
  });

  it("ne propose pas un virement interne [Compte] comme catégorie", () => {
    const txs = parseQIF("!Type:Bank\nD01/03/2026\nT-300,00\nPVIREMENT EPARGNE\nL[Livret A]\n^");
    // La catégorie ne doit pas venir du mapping bancaire : « [Livret A] »
    // désigne un compte, pas une catégorie de dépense.
    expect(txs[0].sub).toBe("");
    expect(txs[0].conf).not.toBe("high");
  });

  it("concatène un mémo réparti sur plusieurs lignes", () => {
    const txs = parseQIF("!Type:Bank\nD01/03/2026\nT-20,00\nPACHAT\nMdebut\nMsuite\n^");
    expect(txs[0].sub).toBe("debut suite");
  });

  it("applique les règles utilisateur", () => {
    const rules = [{ id: 1, pattern: "netflix", catId: "loi", matchType: "contains" }];
    const txs = parseQIF(QIF_BANK, rules);
    expect(txs[2]).toMatchObject({ cat: "loi", conf: "high" });
  });

  it("retourne null sur un fichier qui n'est pas du QIF", () => {
    expect(parseQIF("Date;Montant\n01/03/2026;-10,00")).toBeNull();
    expect(parseQIF("")).toBeNull();
  });

  it("retourne null sur un QIF sans aucune transaction", () => {
    expect(parseQIF("!Type:Bank\n")).toBeNull();
  });
});

describe("parseQIF — dates", () => {
  it("complète une année sur deux chiffres", () => {
    const txs = parseQIF("!Type:Bank\nD01/03/26\nT-5,00\nPACHAT\n^");
    expect(txs[0].d).toBe("01/03/2026");
  });

  it("accepte la notation Quicken « 3/ 1'26 »", () => {
    const txs = parseQIF("!Type:Bank\nD3/ 1'26\nT-5,00\nPACHAT\n^");
    expect(txs[0].d).toBe("03/01/2026");
  });

  // Le format ne dit pas si l'ordre est JJ/MM ou MM/JJ : un deuxième nombre
  // supérieur à 12 est forcément un jour, donc l'ordre est MM/JJ.
  it("permute quand le deuxième nombre ne peut être qu'un jour", () => {
    const txs = parseQIF("!Type:Bank\nD03/25/2026\nT-5,00\nPACHAT\n^");
    expect(txs[0].d).toBe("25/03/2026");
  });

  it("garde JJ/MM quand les deux lectures sont possibles", () => {
    const txs = parseQIF("!Type:Bank\nD03/04/2026\nT-5,00\nPACHAT\n^");
    expect(txs[0].d).toBe("03/04/2026");
  });
});
