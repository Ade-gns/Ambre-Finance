// Reconstruction de lignes/cellules à partir de fragments de texte positionnés.
// Un relevé PDF ne restitue pas forcément le texte dans l'ordre visuel des
// colonnes (l'ordre du flux PDF suit souvent l'ordre d'écriture du logiciel
// d'édition, pas la mise en page) — on reconstruit donc des lignes de tableau
// à partir des coordonnées (x, y) plutôt que de l'ordre brut des items.

/** Regroupe des items en lignes (fragments proches en y). */
export function groupIntoLines(items, yTolerance = 2.5) {
  const sorted = [...items].sort((a, b) => a.y - b.y || a.x - b.x);
  const lines = [];
  for (const it of sorted) {
    let line = lines.find(l => Math.abs(l.y - it.y) <= yTolerance);
    if (!line) { line = { y: it.y, items: [] }; lines.push(line); }
    line.items.push(it);
    line.y = line.items.reduce((s, i) => s + i.y, 0) / line.items.length; // recentre
  }
  lines.sort((a, b) => a.y - b.y);
  for (const l of lines) l.items.sort((a, b) => a.x - b.x);
  return lines;
}

function joinWords(items) {
  let out = items[0].text;
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1], it = items[i];
    const gap = it.x - (prev.x + prev.w);
    out += gap > prev.h * 0.22 ? " " + it.text : it.text;
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Regroupe les items d'une ligne en cellules (séparées par un blanc large = colonne). */
export function groupIntoCells(line, cellGap = 8) {
  const items = line.items;
  if (!items.length) return [];
  const groups = [];
  let cur = [items[0]];
  for (let i = 1; i < items.length; i++) {
    const prev = items[i - 1], it = items[i];
    const gap = it.x - (prev.x + prev.w);
    if (gap > cellGap) { groups.push(cur); cur = [it]; }
    else cur.push(it);
  }
  groups.push(cur);
  return groups.map(g => ({
    text: joinWords(g),
    x0: g[0].x,
    x1: g[g.length - 1].x + g[g.length - 1].w,
    xCenter: (g[0].x + g[g.length - 1].x + g[g.length - 1].w) / 2,
  }));
}

/** Texte complet d'une ligne, cellules jointes par un espace. */
export function lineText(line, cells) {
  return (cells || groupIntoCells(line)).map(c => c.text).join(" ").replace(/\s+/g, " ").trim();
}

// Bruit habituel des relevés bancaires français : en-têtes/pieds de page
// répétés, soldes, totaux récapitulatifs, mentions légales.
const NOISE_PATTERNS = [
  /^relev[eé] de compte/i,
  /^page\s*\d+(\s*\/\s*\d+)?$/i,
  /^solde\b.*(d[ée]but|pr[ée]c[ée]dent|report[ée]|nouveau|final|cl[oô]ture|au\s)/i,
  /^(nouveau solde|ancien solde|total des (op[ée]rations|mouvements))/i,
  /^cumul/i,
  /^\s*(iban|bic|siret|siren)\s*:/i,
  /^conditions? (g[ée]n[ée]rales|tarifaires)/i,
  /^www\./i,
  /^tenue de compte/i,
  /^(date|d[ée]signation|libell[ée]|op[ée]ration|nature|d[ée]tail|montant|d[ée]bit|cr[ée]dit|valeur)s?\s*$/i,
];

export function isNoiseLine(text, extraPatterns = []) {
  const t = (text || "").trim();
  if (!t) return true;
  return NOISE_PATTERNS.some(re => re.test(t)) || extraPatterns.some(re => re.test(t));
}
