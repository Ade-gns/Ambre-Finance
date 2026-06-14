// SVG chart primitives — minimaliste, lignes fines.
// Pas de dépendances; pur SVG pour garder la maîtrise visuelle.
// Converti du fichier d'origine en module ES.

/* ───── helpers ───── */
export const lerp = (a, b, t) => a + (b - a) * t;
let _gradCounter = 0;
const nextGradId = (prefix) => `${prefix}-${++_gradCounter}`;

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

/* ───── Sparkline ───── */
export function Sparkline({ data, width = 120, height = 32, color = "#b8693d", fill = true, strokeWidth = 1.5 }) {
  if (!data || data.length < 2) return <svg width={width} height={height} style={{ display: "block" }} />;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const pts = data.map((v, i) => [
    pad + (i * (width - pad * 2)) / (data.length - 1),
    height - pad - ((v - min) / range) * (height - pad * 2)
  ]);
  const d = pathSmooth(pts);
  const area = `${d} L ${pts[pts.length-1][0]} ${height} L ${pts[0][0]} ${height} Z`;
  const gradId = nextGradId("sg");
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {fill && <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>}
      {fill && <path d={area} fill={`url(#${gradId})`} />}
      <path d={d} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

/* ───── Donut ───── */
export function Donut({ data, size = 220, thickness = 28, gap = 0.012, centerLabel, centerValue }) {
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const total = data.reduce((s, d) => s + d.value, 0);
  let acc = 0;
  const arcs = data.map((d, i) => {
    const frac = d.value / total;
    const a0 = acc * Math.PI * 2 - Math.PI / 2 + gap * Math.PI;
    const a1 = (acc + frac) * Math.PI * 2 - Math.PI / 2 - gap * Math.PI;
    acc += frac;
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return { d: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}`, color: d.color, key: i };
  });
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" style={{ stroke: "var(--grid-line)" }} strokeWidth={thickness}/>
      {arcs.map(a => (
        <path key={a.key} d={a.d} stroke={a.color} strokeWidth={thickness} fill="none" strokeLinecap="butt"/>
      ))}
      {centerValue && (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fontFamily="var(--font-ui)" fontSize="11" letterSpacing="0.04em"
                style={{ fill: "var(--ink-600)", textTransform: "uppercase" }}>{centerLabel}</text>
          <text x={cx} y={cy + 22} textAnchor="middle" fontFamily="var(--font-display)" fontSize="32"
                style={{ fill: "var(--ink-900)" }}>{centerValue}</text>
        </>
      )}
    </svg>
  );
}

/* ───── Area chart (single series) ───── */
export function AreaChart({ data, width = 520, height = 180, color = "#b8693d", yTicks = 4, padX = 8, padY = 18 }) {
  if (!data || data.length < 2) return <svg width={width} height={height} style={{ display: "block" }} />;
  const vals = data.map(d => d.v);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals);
  const rng = max - min || 1;
  const innerW = width - padX * 2 - 36;
  const innerH = height - padY * 2;
  const xs = data.map((_, i) => padX + 36 + (i * innerW) / (data.length - 1));
  const ys = data.map(d => padY + innerH - ((d.v - min) / rng) * innerH);
  const pts = xs.map((x, i) => [x, ys[i]]);
  const line = pathSmooth(pts);
  const area = `${line} L ${xs[xs.length - 1]} ${padY + innerH} L ${xs[0]} ${padY + innerH} Z`;
  const gradId = nextGradId("ag");

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => i / yTicks);
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {ticks.map((t, i) => {
        const y = padY + innerH - t * innerH;
        const v = min + t * rng;
        return (
          <g key={i}>
            <line x1={padX + 36} x2={width - padX} y1={y} y2={y} style={{ stroke: "var(--grid-line)" }} strokeWidth="1"/>
            <text x={padX + 28} y={y + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)"
                  style={{ fill: "var(--ink-500)" }}>
              {Math.round(v).toLocaleString("fr-FR")}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#${gradId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d, i) => (
        <text key={i} x={xs[i]} y={height - 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)"
              style={{ fill: "var(--ink-500)" }}>
          {d.l}
        </text>
      ))}
    </svg>
  );
}

/* ───── Stacked area (multi-series) ───── */
export function StackedArea({ series, labels, width = 600, height = 220, padX = 8, padY = 20 }) {
  if (!labels || labels.length < 2) return <svg width={width} height={height} style={{ display: "block" }} />;
  const n = labels.length;
  const totals = Array(n).fill(0);
  series.forEach(s => s.values.forEach((v, i) => totals[i] += v));
  const max = Math.max(...totals) * 1.05;

  const innerW = width - padX * 2 - 40;
  const innerH = height - padY * 2 - 14;
  const xs = labels.map((_, i) => padX + 40 + (i * innerW) / (n - 1));

  const accs = Array.from({ length: n }, () => 0);
  const stacked = series.map(s => {
    const top = s.values.map((v, i) => {
      accs[i] += v;
      return accs[i];
    });
    return { ...s, top };
  });

  const yOf = v => padY + innerH - (v / max) * innerH;

  const paths = stacked.map((s, idx) => {
    const bottomVals = idx === 0 ? Array(n).fill(0) : stacked[idx - 1].top;
    const topPts = s.top.map((v, i) => [xs[i], yOf(v)]);
    const botPts = bottomVals.map((v, i) => [xs[i], yOf(v)]).reverse();
    const topD = pathSmooth(topPts);
    const botD = pathSmooth(botPts);
    const botD2 = "L " + botD.slice(2);
    return { d: `${topD} ${botD2} Z`, line: topD, color: s.color, key: s.key };
  });

  const ticks = [0, 0.25, 0.5, 0.75, 1];
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {ticks.map((t, i) => {
        const y = padY + innerH - t * innerH;
        return (
          <g key={i}>
            <line x1={padX + 40} x2={width - padX} y1={y} y2={y} style={{ stroke: "var(--grid-line)" }}/>
            <text x={padX + 32} y={y + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)"
                  style={{ fill: "var(--ink-500)" }}>
              {Math.round(t * max).toLocaleString("fr-FR")}
            </text>
          </g>
        );
      })}
      {paths.map(p => (
        <g key={p.key}>
          <path d={p.d} fill={p.color} fillOpacity="0.16" />
          <path d={p.line} fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      ))}
      {labels.map((l, i) => (
        i % 2 === 0 && <text key={i} x={xs[i]} y={height - 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)"
              style={{ fill: "var(--ink-500)" }}>{l}</text>
      ))}
    </svg>
  );
}

/* ───── Horizontal bar list ───── */
export function HBarList({ items, max, width = 360, barHeight = 8 }) {
  const m = max || Math.max(...items.map(i => i.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, width }}>
      {items.map(it => (
        <div key={it.label}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--ink-900)" }}>
              <span className="amb-dot" style={{ background: it.color }}></span>
              {it.label}
            </span>
            <span className="mono" style={{ fontSize: 12, color: "var(--ink-600)" }}>{fmtEUR(it.value, 0)}</span>
          </div>
          <div style={{ height: barHeight, background: "var(--grid-line)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${(it.value / m) * 100}%`, height: "100%", background: it.color, borderRadius: 999 }}/>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───── Paired bars (expense vs income) ───── */
export function PairedBars({ data, width = 520, height = 180, expColor = "#b8693d", incColor = "#6b7a4f", padX = 8, padY = 20 }) {
  const max = Math.max(...data.flatMap(d => [d.exp, d.inc])) * 1.05;
  const innerW = width - padX * 2 - 40;
  const innerH = height - padY * 2 - 14;
  const groupW = innerW / data.length;
  const barW = Math.min(10, groupW * 0.35);
  const yOf = v => padY + innerH - (v / max) * innerH;
  const ticks = [0, 0.5, 1];
  return (
    <svg width={width} height={height} style={{ display: "block" }}>
      {ticks.map((t, i) => {
        const y = padY + innerH - t * innerH;
        return (
          <g key={i}>
            <line x1={padX + 40} x2={width - padX} y1={y} y2={y} style={{ stroke: "var(--grid-line)" }}/>
            <text x={padX + 32} y={y + 4} textAnchor="end" fontSize="10" fontFamily="var(--font-mono)"
                  style={{ fill: "var(--ink-500)" }}>
              {Math.round(t * max).toLocaleString("fr-FR")}
            </text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const cx = padX + 40 + i * groupW + groupW / 2;
        return (
          <g key={i}>
            <rect x={cx - barW - 2} y={yOf(d.inc)} width={barW} height={padY + innerH - yOf(d.inc)} rx="2" fill={incColor} fillOpacity="0.6"/>
            <rect x={cx + 2} y={yOf(d.exp)} width={barW} height={padY + innerH - yOf(d.exp)} rx="2" fill={expColor} fillOpacity="0.85"/>
            <text x={cx} y={height - 4} textAnchor="middle" fontSize="10" fontFamily="var(--font-ui)"
                  style={{ fill: "var(--ink-500)" }}>{d.m}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ───── Ring Gauge ───── */
export function RingGauge({ value, size = 120, thickness = 10, color = "#b8693d" }) {
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.min(1, value);
  return (
    <svg width={size} height={size} style={{ display: "block", transform: "rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} style={{ stroke: "var(--amber-100)" }} strokeWidth={thickness} fill="none"/>
      <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={thickness} fill="none"
              strokeDasharray={`${c * v} ${c}`} strokeLinecap="round"/>
    </svg>
  );
}
