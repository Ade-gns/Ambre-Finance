// CIC — relevé de compte courant.
// Même groupe que le Crédit Mutuel (voir creditMutuel.js) ; détection sur le
// sigle "CIC" isolé pour limiter les faux positifs avec un relevé Crédit
// Mutuel qui mentionnerait le groupe en pied de page.
export default {
  id: "cic",
  label: "CIC",
  detect: fullText => /\bCIC\b/.test(fullText) && /banque|compte|relev[ée]/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle operation"],
  },
  noisePatterns: [
    /^cic\b/i,
    /^cotisation/i,
  ],
};
