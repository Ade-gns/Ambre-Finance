// Société Générale — relevé de compte courant.
export default {
  id: "sg",
  label: "Société Générale",
  detect: fullText => /soci[ée]t[ée]\s*g[ée]n[ée]rale/i.test(fullText) || /\bSG\b.*banque/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle de l operation"],
  },
  noisePatterns: [
    /^soci[ée]t[ée] g[ée]n[ée]rale/i,
    /^cotisation/i,
    /^frais/i,
  ],
};
