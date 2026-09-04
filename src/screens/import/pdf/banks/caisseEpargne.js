// Caisse d'Épargne — relevé de compte courant.
// Groupe BPCE, comme la Banque Populaire (voir banquePopulaire.js).
export default {
  id: "ce",
  label: "Caisse d'Épargne",
  detect: fullText => /caisse\s*d[’']?[ée]pargne/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle operation"],
  },
  noisePatterns: [
    /^caisse d.[ée]pargne/i,
    /^cotisation/i,
  ],
};
