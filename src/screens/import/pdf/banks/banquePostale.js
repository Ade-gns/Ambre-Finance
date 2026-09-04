// La Banque Postale — relevé de Compte Chèques Postal (CCP).
export default {
  id: "lbp",
  label: "La Banque Postale",
  detect: fullText => /la\s*banque\s*postale/i.test(fullText) || /compte\s*ch[eè]ques\s*postal/i.test(fullText),
  roleKeywords: {
    lbl: ["libelle de l operation"],
    date: ["date de l operation"],
  },
  noisePatterns: [
    /^la banque postale/i,
    /^ccp\s*n[°o]/i,
    /^extrait de compte/i,
  ],
};
