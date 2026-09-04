// Helpers partagés par les primitives de graphiques SVG (chartPrimitives.jsx).
// Séparés dans leur propre module car ce ne sont pas des composants React
// (voir react-refresh/only-export-components).

export const lerp = (a, b, t) => a + (b - a) * t;

export const fmtEUR = (n, frac = 0) =>
  new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: frac,
    maximumFractionDigits: frac
  }).format(n);

export function pathSmooth(points, tension = 0.35) {
  if (points.length < 2) return "";
  const d = [`M ${points[0][0]} ${points[0][1]}`];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] || points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) * tension / 3;
    const cp1y = p1[1] + (p2[1] - p0[1]) * tension / 3;
    const cp2x = p2[0] - (p3[0] - p1[0]) * tension / 3;
    const cp2y = p2[1] - (p3[1] - p1[1]) * tension / 3;
    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2[0]} ${p2[1]}`);
  }
  return d.join(" ");
}
