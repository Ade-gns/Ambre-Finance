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

export const MONTHS_FR   = ["","Janv.","Févr.","Mars","Avril","Mai","Juin","Juil.","Août","Sept.","Oct.","Nov.","Déc."];
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

export const DEFAULT_ALERT_DEFS = [
  { id: 1, type: "income",     name: "Revenu encaissé",           keyword: "salaire", thr: "✓ détection", cond: "Virement contenant « salaire » reçu ce mois",           on: true,  color: "#6b7a4f" },
  { id: 2, type: "budget_pct", name: "Budget Loisirs proche",    catId: "loi",        threshold: 85,      thr: "85 %",  cond: "Dépenses Loisirs ≥ 85 % du budget mensuel",   on: true,  color: "#a85a48" },
  { id: 3, type: "budget_pct", name: "Budget Alimentation",      catId: "alim",       threshold: 90,      thr: "90 %",  cond: "Dépenses Alimentation ≥ 90 % du budget mensuel", on: true, color: "#b8693d" },
  { id: 4, type: "large_tx",   name: "Transaction inhabituelle", threshold: 200,       thr: "200 €",       cond: "Dépense > 200 € hors Logement et Épargne",               on: true,  color: "#9d8b73" },
  { id: 5, type: "custom",     name: "Solde courant bas",        thr: "500 €",         cond: "Solde courant < 500 €",                                                     on: false, color: "#3d2817" },
  { id: 6, type: "duplicate",  name: "Doublon potentiel",        thr: "— auto —",      cond: "Montant identique détecté en 48 h",                                         on: true,  color: "#cd8459" },
];

export function useAlertDefs() { return useLocalStorage("alertDefs", DEFAULT_ALERT_DEFS); }

function fmtShort(n) {
  return Math.abs(n).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

export function computeAlertNotifs(transactions, categories, alertDefs) {
  if (!transactions?.length) return [];
  const defs = alertDefs || DEFAULT_ALERT_DEFS;
  const isOn = type => { const d = defs.find(x => x.type === type); return !d || d.on !== false; };

  const now    = new Date();
  const curKey = String(now.getMonth() + 1).padStart(2, "0") + "/" + now.getFullYear();
  const curLabel = monthKeyLabel(curKey);
  const monthTxs = transactions.filter(t => txMonthKey(t.d) === curKey);
  if (!monthTxs.length) return [];

  const catMap  = Object.fromEntries((categories || []).map(c => [c.id, c]));
  const sevenAgo = new Date(now - 7 * 24 * 3600 * 1000);
  const notifs  = [];

  (categories || []).forEach(cat => {
    if (!cat.budget || cat.id === "inc" || cat.id === "epa" || cat.id === "aut") return;
    const def = defs.find(d => d.type === "budget_pct" && d.catId === cat.id);
    if (def?.on === false) return;
    const spent   = monthTxs.filter(t => t.cat === cat.id && t.amt < 0).reduce((s, t) => s + Math.abs(t.amt), 0);
    const pct     = Math.round(spent / cat.budget * 100);
    const trigPct = def?.threshold ?? 80;
    if (pct >= 100) {
      notifs.push({ id: `budget_${cat.id}_${curKey}_over`, kind: "threshold",
        name: `Budget ${cat.label} dépassé`,
        msg: `${fmtShort(spent)} dépensés sur ${fmtShort(cat.budget)} de budget (${pct} %).`,
        cat: { label: cat.label, color: cat.color }, source: "Budget mensuel",
        state: "unread", day: "Ce mois", time: "—", month: curLabel, thisWeek: true, cta: "Voir les dépenses" });
    } else if (pct >= trigPct) {
      notifs.push({ id: `budget_${cat.id}_${curKey}_warn`, kind: "threshold",
        name: `Budget ${cat.label} à ${pct} %`,
        msg: `${fmtShort(spent)} sur ${fmtShort(cat.budget)} de budget prévu ce mois.`,
        cat: { label: cat.label, color: cat.color }, source: "Budget mensuel",
        state: "unread", day: "Ce mois", time: "—", month: curLabel, thisWeek: true, cta: "Voir les dépenses" });
    }
  });

  if (isOn("income")) {
    const incomes = monthTxs.filter(t => t.cat === "inc");
    if (incomes.length > 0) {
      const total = incomes.reduce((s, t) => s + t.amt, 0);
      notifs.push({ id: `income_${curKey}`, kind: "event",
        name: "Revenu encaissé",
        msg: `${fmtShort(total)} reçus ce mois (${incomes.length} virement${incomes.length > 1 ? "s" : ""}).`,
        cat: { label: "Revenus", color: "#6b7a4f" }, source: incomes[0].lbl,
        state: "unread", day: incomes[0].d?.slice(0, 5) || "Ce mois", time: "—",
        month: curLabel, thisWeek: true, cta: "Voir les revenus" });
    }
  }

  if (isOn("large_tx")) {
    const thr = defs.find(d => d.type === "large_tx")?.threshold ?? 300;
    monthTxs
      .filter(t => t.amt < -thr && t.cat !== "loy" && t.cat !== "epa")
      .filter(t => { const d = parseTxDate(t.d); return d && d >= sevenAgo; })
      .slice(0, 5)
      .forEach(t => {
        const cat = catMap[t.cat] || { label: "Autre", color: "#9d8b73" };
        notifs.push({ id: `large_${t.id}`, kind: "anomaly", txId: t.id,
          name: "Transaction inhabituelle",
          msg: `${t.lbl} — ${fmtShort(Math.abs(t.amt))}. Vérifiez que c'est attendu.`,
          cat: { label: cat.label, color: cat.color }, source: t.lbl,
          state: "unread", day: t.d?.slice(0, 5) || "Récent", time: "—",
          month: curLabel, thisWeek: true, cta: "Voir la transaction" });
      });
  }

  if (isOn("duplicate")) {
    const seen = new Map();
    monthTxs.filter(t => t.amt < 0).forEach(t => {
      const key = Math.abs(t.amt).toFixed(2);
      if (seen.has(key)) {
        const prev = seen.get(key);
        const d1 = parseTxDate(t.d), d2 = parseTxDate(prev.d);
        if (d1 && d2 && Math.abs(d1 - d2) <= 48 * 3600 * 1000 && String(t.id) !== String(prev.id)) {
          const ids = [String(t.id), String(prev.id)].sort();
          const cat = catMap[t.cat] || { label: "Autre", color: "#9d8b73" };
          notifs.push({ id: `dup_${ids[0]}_${ids[1]}`, kind: "duplicate", txId: t.id,
            name: "Doublon potentiel",
            msg: `${fmtShort(Math.abs(t.amt))} le ${t.d?.slice(0, 5) || "?"} et le ${prev.d?.slice(0, 5) || "?"}.`,
            cat: { label: cat.label, color: cat.color }, source: t.lbl,
            state: "unread", day: t.d?.slice(0, 5) || "Récent", time: "—",
            month: curLabel, thisWeek: true, cta: "Comparer" });
        }
      } else {
        seen.set(key, t);
      }
    });
  }

  return notifs;
}

export function mergeAlertNotifs(existing, computed) {
  const ids = new Set((existing || []).map(a => a.id));
  return [...computed.filter(n => !ids.has(n.id)), ...(existing || [])];
}

export function applyRules(rules, lbl) {
  if (!rules?.length || !lbl) return null;
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
  const n = norm(lbl);
  for (const rule of rules) {
    if (rule.active === false) continue;
    const p = norm(rule.pattern || "");
    if (!p) continue;
    if (rule.matchType === "exact" ? n === p : n.includes(p)) return rule.catId;
  }
  return null;
}

export function reapplyRules(transactions, rules, forceAll = false) {
  return transactions.map(t => {
    if (!forceAll && t.cat && t.cat !== "aut") return t;
    const cat = applyRules(rules, t.lbl);
    return cat ? { ...t, cat } : t;
  });
}
