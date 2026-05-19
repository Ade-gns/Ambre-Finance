// Shared mock data + categories for all dashboard variations
const CATEGORIES = [
  { id: "alim",  label: "Alimentation",   color: "#b8693d", amount: 487.20, share: 0.28, trend: +0.04 },
  { id: "loy",   label: "Logement",       color: "#3d2817", amount: 920.00, share: 0.53, trend:  0.00 },
  { id: "tra",   label: "Transports",     color: "#6b7a4f", amount: 142.40, share: 0.08, trend: -0.12 },
  { id: "loi",   label: "Loisirs",        color: "#a85a48", amount: 96.80,  share: 0.06, trend: +0.18 },
  { id: "san",   label: "Santé",          color: "#9d8b73", amount: 38.50,  share: 0.02, trend: -0.05 },
  { id: "abo",   label: "Abonnements",    color: "#cd8459", amount: 54.99,  share: 0.03, trend:  0.00 },
];

const MONTHLY = [
  { m: "Juin",   exp: 1612, inc: 2400 },
  { m: "Juil.",  exp: 1840, inc: 2400 },
  { m: "Août",   exp: 1995, inc: 2400 },
  { m: "Sept.",  exp: 1720, inc: 2480 },
  { m: "Oct.",   exp: 1602, inc: 2480 },
  { m: "Nov.",   exp: 1888, inc: 2480 },
  { m: "Déc.",   exp: 2210, inc: 2680 },
  { m: "Janv.",  exp: 1742, inc: 2560 },
  { m: "Févr.",  exp: 1610, inc: 2560 },
  { m: "Mars",   exp: 1830, inc: 2560 },
  { m: "Avril",  exp: 1695, inc: 2560 },
  { m: "Mai",    exp: 1739.89, inc: 2560 },
];

const TRANSACTIONS = [
  { d: "14 mai", label: "Carrefour Market",         cat: "alim", amt: -52.34, mode: "CB" },
  { d: "13 mai", label: "Loyer — Mai",              cat: "loy",  amt: -920.00, mode: "Virement" },
  { d: "12 mai", label: "Salaire",                  cat: "inc",  amt: +2560.00, mode: "Virement" },
  { d: "11 mai", label: "Spotify Premium",          cat: "abo",  amt: -10.99, mode: "Préautorisé" },
  { d: "11 mai", label: "SNCF — Paris ↔ Lyon",      cat: "tra",  amt: -67.00, mode: "CB" },
  { d: "10 mai", label: "Boulangerie Pichon",       cat: "alim", amt: -8.40,  mode: "CB" },
  { d: "09 mai", label: "Pharmacie de l'Hôtel",     cat: "san",  amt: -22.50, mode: "CB" },
  { d: "08 mai", label: "Le Petit Café",            cat: "loi",  amt: -14.20, mode: "CB" },
  { d: "07 mai", label: "Total Énergies",           cat: "tra",  amt: -48.10, mode: "CB" },
  { d: "06 mai", label: "Monoprix",                 cat: "alim", amt: -39.85, mode: "CB" },
];

const ALERTS = [
  { cat: "loi",  label: "Loisirs",      msg: "Seuil atteint à 97%", level: "warn" },
  { cat: "alim", label: "Alimentation", msg: "+4% vs avril",        level: "info" },
];

window.AMBRE_DATA = { CATEGORIES, MONTHLY, TRANSACTIONS, ALERTS };
