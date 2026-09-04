// LCL (Le Crédit Lyonnais) — relevé de compte courant.
export default {
  id: "lcl",
  label: "LCL",
  detect: fullText => /\bLCL\b/.test(fullText) || /le\s*cr[ée]dit\s*lyonnais/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle operation"],
  },
  noisePatterns: [
    /^lcl\b/i,
    /^cotisation/i,
  ],
};
