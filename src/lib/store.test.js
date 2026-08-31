import { describe, it, expect } from "vitest";
import {
  autoCat,
  parseTxDate,
  txMonthKey,
  monthKeyLabel,
  computeMonthly,
  computeCatTotals,
  applyRules,
  normalizeTransaction,
  DEFAULT_CATS,
} from "./store";

describe("autoCat", () => {
  it("classe tout montant positif en revenu", () => {
    expect(autoCat("Salaire janvier", 1500)).toBe("inc");
    expect(autoCat("N'importe quoi", 1)).toBe("inc");
  });

  it("détecte les catégories par mot-clé du libellé", () => {
    expect(autoCat("PRLV LOYER APPARTEMENT", -800)).toBe("loy");
    expect(autoCat("NETFLIX.COM", -13.49)).toBe("abo");
    expect(autoCat("SNCF CONNECT", -45)).toBe("tra");
    expect(autoCat("CARREFOUR MARKET", -62.3)).toBe("alim");
    expect(autoCat("PHARMACIE DU CENTRE", -12)).toBe("san");
    expect(autoCat("RESTAURANT LE BISTROT", -34)).toBe("loi");
    expect(autoCat("VIREMENT LIVRET A", -200)).toBe("epa");
  });

  it("retombe sur 'aut' quand rien ne matche", () => {
    expect(autoCat("XYZ INCONNU 123", -10)).toBe("aut");
  });

  it("ignore la casse et les accents", () => {
    expect(autoCat("pharmacie du marché", -5)).toBe("san");
  });
});

describe("parseTxDate", () => {
  it("parse une date DD/MM/YY", () => {
    const d = parseTxDate("05/03/26");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2); // mars = index 2
    expect(d.getDate()).toBe(5);
  });

  it("parse une date DD/MM/YYYY", () => {
    const d = parseTxDate("05/03/2026");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(5);
  });

  it("retourne null pour une entrée vide ou invalide", () => {
    expect(parseTxDate("")).toBeNull();
    expect(parseTxDate(null)).toBeNull();
    expect(parseTxDate("abc")).toBeNull();
  });
});

describe("txMonthKey", () => {
  it("construit la clé MM/YYYY à partir d'une date à 2 chiffres d'année", () => {
    expect(txMonthKey("05/03/26")).toBe("03/2026");
  });

  it("construit la clé MM/YYYY à partir d'une date à 4 chiffres d'année", () => {
    expect(txMonthKey("05/03/2026")).toBe("03/2026");
  });

  it("retourne null si la date est incomplète", () => {
    expect(txMonthKey("05/03")).toBeNull();
    expect(txMonthKey(null)).toBeNull();
  });
});

describe("monthKeyLabel", () => {
  it("formate une clé de mois en libellé complet", () => {
    expect(monthKeyLabel("03/2026")).toBe("Mars 2026");
    expect(monthKeyLabel("12/2025")).toBe("Décembre 2025");
  });

  it("retourne un tiret pour une clé vide", () => {
    expect(monthKeyLabel(null)).toBe("—");
  });
});

describe("computeMonthly", () => {
  it("agrège dépenses et revenus par mois, triés du plus ancien au plus récent", () => {
    const txs = [
      { d: "10/02/26", amt: -50 },
      { d: "15/02/26", amt: 2000 },
      { d: "01/01/26", amt: -20 },
      { d: "20/01/26", amt: 1000 },
    ];
    const monthly = computeMonthly(txs);
    expect(monthly.map(m => m.key)).toEqual(["01/2026", "02/2026"]);
    expect(monthly[0]).toMatchObject({ exp: 20, inc: 1000 });
    expect(monthly[1]).toMatchObject({ exp: 50, inc: 2000 });
  });

  it("ignore les transactions sans date exploitable", () => {
    const txs = [{ d: "", amt: -10 }, { d: "01/01/26", amt: -5 }];
    expect(computeMonthly(txs)).toHaveLength(1);
  });
});

describe("computeCatTotals", () => {
  const txs = [
    { d: "01/01/26", amt: -100, cat: "alim" },
    { d: "02/01/26", amt: -300, cat: "loy" },
    { d: "03/01/26", amt: -100, cat: "alim" },
    { d: "04/01/26", amt: 1500, cat: "inc" },
  ];

  it("calcule le montant et la part de chaque catégorie sur la période donnée", () => {
    const totals = computeCatTotals(txs, DEFAULT_CATS, "01/2026");
    const alim = totals.find(c => c.id === "alim");
    const loy = totals.find(c => c.id === "loy");
    expect(alim.amount).toBe(200);
    expect(loy.amount).toBe(300);
    expect(alim.share).toBeCloseTo(200 / 500);
    expect(loy.share).toBeCloseTo(300 / 500);
  });

  it("exclut la catégorie revenus et les catégories sans dépense", () => {
    const totals = computeCatTotals(txs, DEFAULT_CATS, "01/2026");
    expect(totals.find(c => c.id === "inc")).toBeUndefined();
    expect(totals.find(c => c.id === "san")).toBeUndefined();
  });

  it("porte sur toutes les transactions quand monthKey est omis", () => {
    const totals = computeCatTotals(txs, DEFAULT_CATS);
    expect(totals.find(c => c.id === "alim").amount).toBe(200);
  });
});

describe("applyRules", () => {
  const rules = [
    { pattern: "netflix", catId: "abo", matchType: "contains", active: true },
    { pattern: "salaire acme", catId: "inc", matchType: "exact", active: true },
    { pattern: "desactivee", catId: "loi", matchType: "contains", active: false },
  ];

  it("retourne la catégorie de la première règle 'contains' qui matche", () => {
    expect(applyRules(rules, "NETFLIX.COM PARIS")).toBe("abo");
  });

  it("respecte le matchType 'exact'", () => {
    expect(applyRules(rules, "salaire acme")).toBe("inc");
    expect(applyRules(rules, "salaire acme corp")).not.toBe("inc");
  });

  it("ignore les règles inactives", () => {
    expect(applyRules(rules, "quelque chose desactivee")).toBeNull();
  });

  it("normalise casse et accents avant de comparer", () => {
    const withAccent = [{ pattern: "café", catId: "loi", matchType: "contains", active: true }];
    expect(applyRules(withAccent, "CAFE DU COIN")).toBe("loi");
  });

  it("retourne null sans règles ou sans libellé", () => {
    expect(applyRules([], "netflix")).toBeNull();
    expect(applyRules(rules, "")).toBeNull();
  });
});

describe("normalizeTransaction / génération d'id", () => {
  it("conserve l'id fourni s'il existe", () => {
    const t = normalizeTransaction({ id: 42, d: "01/01/26", lbl: "Test", amt: -10 });
    expect(t.id).toBe(42);
  });

  it("génère des ids uniques pour un import en lot volumineux (régression Date.now()+Math.random())", () => {
    const batch = Array.from({ length: 5000 }, (_, i) => ({
      d: "01/01/26",
      lbl: `Transaction ${i}`,
      amt: -1 * (i + 1),
    }));
    const normalized = batch.map(t => normalizeTransaction(t));
    const ids = normalized.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("déduit la catégorie automatiquement quand elle n'est pas fournie", () => {
    const t = normalizeTransaction({ d: "01/01/26", lbl: "NETFLIX.COM", amt: -13.49 });
    expect(t.cat).toBe("abo");
  });
});
