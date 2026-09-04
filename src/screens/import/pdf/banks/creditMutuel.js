// Crédit Mutuel — relevé de compte courant.
// Fait partie du même groupe que le CIC (Crédit Mutuel Alliance Fédérale) ;
// mise en page supposée proche de celle du CIC (voir cic.js), configs
// néanmoins séparées pour rester ajustables indépendamment si un vrai relevé
// révèle des différences.
export default {
  id: "cm",
  label: "Crédit Mutuel",
  detect: fullText => /cr[ée]dit\s*mutuel/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle operation"],
  },
  noisePatterns: [
    /^cr[ée]dit mutuel/i,
    /^cotisation/i,
  ],
};
