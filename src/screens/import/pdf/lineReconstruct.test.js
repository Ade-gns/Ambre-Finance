import { describe, it, expect } from "vitest";
import { groupIntoLines, groupIntoCells, lineText, isNoiseLine } from "./lineReconstruct";

describe("groupIntoLines", () => {
  it("regroupe des items proches en y dans la même ligne, triés par x", () => {
    const items = [
      { text: "8,70",  x: 480, y: 100.3, w: 20, h: 9 },
      { text: "01/03/2026", x: 50, y: 100, w: 55, h: 9 },
      { text: "BOULANGERIE", x: 110, y: 99.8, w: 60, h: 9 },
      { text: "MONOPRIX", x: 110, y: 130, w: 55, h: 9 },
    ];
    const lines = groupIntoLines(items);
    expect(lines).toHaveLength(2);
    expect(lines[0].items.map(i => i.text)).toEqual(["01/03/2026", "BOULANGERIE", "8,70"]);
    expect(lines[1].items.map(i => i.text)).toEqual(["MONOPRIX"]);
  });

  it("sépare deux lignes distinctes même proches si hors tolérance", () => {
    const items = [
      { text: "A", x: 10, y: 100, w: 5, h: 9 },
      { text: "B", x: 10, y: 108, w: 5, h: 9 }, // > yTolerance par défaut (2.5)
    ];
    const lines = groupIntoLines(items);
    expect(lines).toHaveLength(2);
  });
});

describe("groupIntoCells", () => {
  it("sépare les cellules par un grand blanc, joint les mots d'une même cellule", () => {
    const line = {
      y: 100,
      items: [
        { text: "01/03/2026", x: 50,  y: 100, w: 45, h: 9 },
        { text: "BOULANGERIE", x: 110, y: 100, w: 55, h: 9 },
        { text: "PICHON",      x: 167, y: 100, w: 35, h: 9 }, // petit blanc → même cellule
        { text: "8,70",        x: 480, y: 100, w: 20, h: 9 }, // grand blanc → nouvelle cellule
      ],
    };
    const cells = groupIntoCells(line);
    expect(cells.map(c => c.text)).toEqual(["01/03/2026", "BOULANGERIE PICHON", "8,70"]);
  });
});

describe("lineText", () => {
  it("concatène les cellules d'une ligne", () => {
    const line = { y: 0, items: [{ text: "A", x: 0, y: 0, w: 5, h: 9 }, { text: "B", x: 50, y: 0, w: 5, h: 9 }] };
    expect(lineText(line)).toBe("A B");
  });
});

describe("isNoiseLine", () => {
  it("reconnaît les motifs de bruit courants", () => {
    expect(isNoiseLine("Solde en début de période")).toBe(true);
    expect(isNoiseLine("SOLDE PRECEDENT AU 01/03/2026")).toBe(true);
    expect(isNoiseLine("Page 2/4")).toBe(true);
    expect(isNoiseLine("IBAN: FR76 1234 5678")).toBe(true);
    expect(isNoiseLine("")).toBe(true);
  });

  it("ne rejette pas une ligne de transaction plausible", () => {
    expect(isNoiseLine("01/03/2026 BOULANGERIE PICHON 8,70")).toBe(false);
  });

  it("accepte des motifs additionnels propres à une banque", () => {
    expect(isNoiseLine("Cotisation carte Visa Premier", [/cotisation carte/i])).toBe(true);
  });
});
