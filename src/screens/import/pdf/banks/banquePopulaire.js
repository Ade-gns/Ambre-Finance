// Banque Populaire — relevé de compte courant.
// Fait partie du groupe BPCE, comme la Caisse d'Épargne (voir
// caisseEpargne.js) ; détection sur "Banque Populaire" pour rester distincte.
export default {
  id: "bp",
  label: "Banque Populaire",
  detect: fullText => /banque\s*populaire/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle operation"],
  },
  noisePatterns: [
    /^banque populaire/i,
    /^cotisation/i,
  ],
};
