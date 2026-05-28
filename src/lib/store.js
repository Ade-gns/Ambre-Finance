import { useLocalStorage } from "./storage";

export const DEFAULT_CATS = [
  { id: "inc",  label: "Revenus",       color: "#6b7a4f", budget: 0,    iconIdx: 0 },
  { id: "alim", label: "Alimentation",  color: "#b8693d", budget: 500,  iconIdx: 0 },
  { id: "loy",  label: "Logement",      color: "#3d2817", budget: 1000, iconIdx: 0 },
  { id: "tra",  label: "Transports",    color: "#7a8c5c", budget: 200,  iconIdx: 0 },
  { id: "loi",  label: "Loisirs",       color: "#a85a48", budget: 200,  iconIdx: 0 },
  { id: "san",  label: "Santé",         color: "#9d8b73", budget: 100,  iconIdx: 0 },
  { id: "abo",  label: "Abonnements",   color: "#cd8459", budget: 100,  iconIdx: 0 },
  { id: "epa",  label: "Épargne",       color: "#7a5c3a", budget: 300,  iconIdx: 0 },
  { id: "aut",  label: "Autre",         color: "#9d8b73", budget: 0,    iconIdx: 0 },
];

const MONTHS_FR   = ["","Janv.","Févr.","Mars","Avril","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
const MONTHS_FULL = ["","Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DOW_FR      = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];

export function autoCat(lbl, amt) {
  if (amt > 0) return "inc";
  const l = (lbl || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/loyer|charges loc|sci |syndic|fonciere|assurance hab|engie|edf |gaz de france|eau potable|veolia|suez|gardiennage|copropr/.test(l)) return "loy";
  if (/netflix|spotify|amazon.?prime|amazon music|disney\+|deezer|apple music|apple tv|apple one|canal\+|youtube premium|hbo|playstation plus|ps plus|microsoft 365|adobe |github|notion|free.?mobile|freemobile|sfr |orange |bouygues|sosh|icloud|dropbox|nordvpn|ovh |hetzner/.test(l)) return "abo";
  if (/sncf|ratp|navigo|blablacar|autoroute|vinci|sanef|peage|velib|lime |airfrance|air france|ryanair|easyjet|ouigo|ouibus|flixbus|parking|stationnement|transdev|keolis|thalys|eurostar/.test(l)) return "tra";
  if (/uber(?!.*eat)|bolt(?!.*food)|taxi|vtc|kapten|heetch/.test(l)) return "tra";
  if (/carrefour|monoprix|auchan|leclerc|lidl|aldi|intermarche|franprix|casino |boulangerie|patisserie|epicerie|biocoop|naturalia|supermarche|marche |picard|grand frais|traiteur|metro cash|fresh|g20 |simply|cora |match /.test(l)) return "alim";
  if (/pharmacie|medec|docteur|hopital|clinique|dentiste|opticien|kine|mutuelle|secu|ameli|cpam|infirmier|psychologue|orthophon|cabinet.?med|chirurg|osteo|dermato/.test(l)) return "san";
  if (/restaurant|brasserie|bistrot?|cafe |bar |pizzeria|kebab|sushi|mcdo|mcdonald|burger king|kfc|subway|domino|pizza|deliveroo|uber.?eat|just.?eat|foodora|cinema|allocine|concert|theatre|musee|salle.?sport|amazon|ebay|zalando|shein|asos|vinted|booking|airbnb|hotel|etsy|fnac|cultura/.test(l)) return "loi";
  if (/livret|epargne|assurance.vie|pel |cer |placement|bourse|sicav|fcpi|virement.?epargne/.test(l)) return "epa";
  return "aut";
}

export function parseTxDate(d) {
  if (!d) return null;
  const p = d.split("/");
  if (p.length < 2) return null;
  const day   = parseInt(p[0], 10);
  const month = parseInt(p[1], 10) - 1;
  const year  = p.length >= 3 ? (p[2].length === 2 ? 2000 + parseInt(p[2], 10) : parseInt(p[2], 10)) : new Date().getFullYear();
  return isNaN(day) || isNaN(month) ? null : new Date(year, month, day);
}

export function txMonthKey(d) {
  if (!d) return null;
  const p = d.split("/");
  if (p.length < 3) return null;
  const year = p[2].length === 2 ? "20" + p[2] : p[2];
  return p[1].padStart(2, "0") + "/" + year; // "05/2026"
}

export function monthKeyLabel(key) {
  if (!key) return "—";
  const [m, y] = key.split("/");
  return (MONTHS_FULL[parseInt(m)] || key) + " " + y;
}

export function monthKeyShort(key) {
  if (!key) return "—";
  return MONTHS_FR[parseInt(key.split("/")[0])] || key;
}

export function txDow(d) {
  const date = parseTxDate(d);
  return date ? DOW_FR[date.getDay()] : "";
}

export function normalizeTransaction(t, accountName = "Principal") {
  return {
    id:   t.id   || (Date.now() + Math.random()),
    d:    t.d,
    dow:  txDow(t.d),
    lbl:  (t.lbl || "—").trim(),
    sub:  (t.sub || "").trim(),
    cat:  t.cat  || autoCat(t.lbl, t.amt),
    amt:  t.amt,
    acc:  t.acc  || accountName,
    mode: t.mode || (t.amt > 0 ? "Virement" : "CB"),
    tags: t.tags || [],
  };
}

export function txMonths(transactions) {
  const keys = new Set(transactions.map(t => txMonthKey(t.d)).filter(Boolean));
  return [...keys].sort((a, b) => b.localeCompare(a)); // newest first
}

export function computeMonthly(transactions) {
  const byMonth = {};
  transactions.forEach(t => {
    const key = txMonthKey(t.d);
    if (!key) return;
    if (!byMonth[key]) byMonth[key] = { key, m: monthKeyShort(key), exp: 0, inc: 0 };
    if (t.amt < 0) byMonth[key].exp += Math.abs(t.amt);
    else           byMonth[key].inc += t.amt;
  });
  return Object.values(byMonth).sort((a, b) => a.key.localeCompare(b.key)); // oldest→newest
}

export function computeCatTotals(transactions, cats, monthKey) {
  const txs = monthKey ? transactions.filter(t => txMonthKey(t.d) === monthKey) : transactions;
  const total = txs.filter(t => t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
  return cats
    .filter(c => c.id !== "inc")
    .map(cat => {
      const amount = txs.filter(t => t.cat === cat.id && t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
      return { ...cat, amount, share: total > 0 ? amount / total : 0 };
    })
    .filter(c => c.amount > 0);
}

export function useTransactions()   { return useLocalStorage("transactions",   []); }
export function useCategories()     { return useLocalStorage("categories",     DEFAULT_CATS); }
export function useImportHistory()  { return useLocalStorage("importHistory",  []); }
export function useAutoRules()      { return useLocalStorage("autoRules",      []); }

export function applyRules(rules, lbl) {
  if (!rules?.length || !lbl) return null;
  const n = lbl.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const rule of rules) {
    if (rule.active === false) continue;
    const p = (rule.pattern || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (!p) continue;
    if (rule.matchType === "exact" ? n === p : n.includes(p)) return rule.catId;
  }
  return null;
}
