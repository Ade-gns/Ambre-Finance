// Crédit Agricole — relevé de compte courant.
// Banque régionale : la mise en page peut varier légèrement d'une caisse
// régionale à l'autre (LCA, CA Île-de-France, CA Alpes-Provence…) — ce
// gabarit vise le format le plus répandu (Date / Libellé / Débit / Crédit).
export default {
  id: "ca",
  label: "Crédit Agricole",
  detect: fullText => /cr[ée]dit\s*agricole/i.test(fullText) || /\bC\.?A\.?\s*(Alpes|Ile|Normandie|Bretagne|Charente|Provence)/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle operation"],
  },
  noisePatterns: [
    /^caisse r[ée]gionale/i,
    /^cotisation/i,
    /^extrait de compte/i,
  ],
};
