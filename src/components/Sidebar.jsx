// Sidebar — barre latérale partagée par tous les écrans.
// Utilise React Router pour la navigation.

import { NavLink, useLocation } from "react-router-dom";
import {
  IcHome, IcImport, IcList, IcTag, IcChart, IcBell, IcSettings, IcSun, IcLock
} from "../lib/icons";

const navItems = [
  { to: "/",             icon: IcHome,     label: "Tableau" },
  { to: "/import",       icon: IcImport,   label: "Importer" },
  { to: "/transactions", icon: IcList,     label: "Transactions" },
  { to: "/categories",   icon: IcTag,      label: "Catégories" },
  { to: "/evolution",    icon: IcChart,    label: "Évolution" },
  { to: "/alerts",       icon: IcBell,     label: "Alertes", badge: 2 },
  { to: "/settings",     icon: IcSettings, label: "Paramètres" },
];

export default function Sidebar() {
  return (
    <aside className="atc-side">
      <style>{`
        .atc-side {
          background: var(--cream-50);
          border-right: 1px solid var(--line);
          display: flex; flex-direction: column;
          padding: 20px 0;
          align-items: center;
          gap: 8px;
        }
        .atc-logo {
          width: 38px; height: 38px;
          border-radius: 10px;
          background: linear-gradient(140deg, #cd8459, #b8693d);
          color: var(--cream-50);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 22px;
          font-style: italic;
          margin-bottom: 12px;
        }
        .atc-nav-btn {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-500);
          position: relative;
          text-decoration: none;
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .atc-nav-btn:hover {
          background: var(--cream-100);
        }
        .atc-nav-btn.active {
          background: var(--amber-100);
          color: var(--amber-500);
        }
        .atc-nav-btn .bdg {
          position: absolute;
          top: 6px; right: 6px;
          width: 6px; height: 6px;
          border-radius: 999px;
          background: var(--rose-500);
        }
        .atc-side-foot {
          margin-top: auto;
          display: flex; flex-direction: column;
          gap: 8px;
          align-items: center;
        }
      `}</style>

      <div className="atc-logo">a</div>

      {navItems.map((it) => {
        const Ico = it.icon;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) => "atc-nav-btn" + (isActive ? " active" : "")}
            title={it.label}
          >
            <Ico size={18}/>
            {it.badge && <span className="bdg"/>}
          </NavLink>
        );
      })}

      <div className="atc-side-foot">
        <button className="atc-nav-btn" title="Thème"><IcSun size={18}/></button>
        <button className="atc-nav-btn" title="Verrouiller"><IcLock size={16}/></button>
      </div>
    </aside>
  );
}
