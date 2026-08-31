import { parseTxDate } from "../../lib/store";

const MONTHS_SHORT_TX = ["","janv.","févr.","mars","avr.","mai","juin","juil.","août","sept.","oct.","nov.","déc."];

export const MONTH_NUM = { "Janvier":1,"Février":2,"Mars":3,"Avril":4,"Mai":5,"Juin":6,"Juillet":7,"Août":8,"Septembre":9,"Octobre":10,"Novembre":11,"Décembre":12 };


export function getWeekGroups(txs) {
  const sorted = [...txs].sort((a, b) => {
    const da = parseTxDate(a.d), db = parseTxDate(b.d);
    return (db?.getTime() || 0) - (da?.getTime() || 0);
  });
  const groupMap = {};
  const groupOrder = [];
  sorted.forEach(t => {
    const date = parseTxDate(t.d);
    if (!date) return;
    const monday = new Date(date);
    const diff = date.getDay() === 0 ? -6 : 1 - date.getDay();
    monday.setDate(date.getDate() + diff);
    const key = monday.toISOString().slice(0, 10);
    if (!groupMap[key]) {
      const label = `Semaine du ${monday.getDate()} ${MONTHS_SHORT_TX[monday.getMonth() + 1]}`;
      groupMap[key] = { key, label, txs: [] };
      groupOrder.push(key);
    }
    groupMap[key].txs.push(t);
  });
  return groupOrder.map(k => groupMap[k]);
}

export function exportTxCSV(txs, filename = "transactions.csv") {
  const header = "Date,Libellé,Sous-titre,Compte,Catégorie,Mode,Montant";
  const rows = txs.map(t =>
    [t.d, `"${t.lbl}"`, `"${t.sub || ""}"`, t.acc, t.cat, t.mode, t.amt].join(",")
  );
  const csv = header + "\n" + rows.join("\n");
  const a   = document.createElement("a");
  a.href    = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export function txCatStyle(cat, catDefs = []) {
  if (cat === "inc") return { color: "#6b7a4f", label: "Revenus" };
  if (cat === "epa") return { color: "#7a5c3a", label: "Épargne" };
  const c = catDefs.find(x => x.id === cat);
  return c ? { color: c.color, label: c.label } : { color: "#9d8b73", label: "Autre" };
}

