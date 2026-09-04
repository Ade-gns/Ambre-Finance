// BNP Paribas — relevé de compte courant.
// Colonnes usuelles : Date / Nature de l'opération (ou Libellé) / Valeur / Débit / Crédit.
export default {
  id: "bnp",
  label: "BNP Paribas",
  detect: fullText => /bnp\s*paribas/i.test(fullText),
  roleKeywords: {
    lbl: ["nature de l operation", "libelle operation"],
  },
  noisePatterns: [
    /^cotisation carte/i,
    /^frais de tenue de compte/i,
    /^bnp paribas s\.?a\.?/i,
    /^banque de detail en france/i,
  ],
};
