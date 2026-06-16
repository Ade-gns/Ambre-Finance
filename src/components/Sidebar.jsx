// Sidebar — barre latérale partagée par tous les écrans.
// BottomNav — navigation fixe en bas pour mobile.
// Utilise React Router pour la navigation.

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { load, save } from "../lib/storage";
import {
  IcHome, IcImport, IcList, IcTag, IcChart, IcBell, IcSettings, IcSun, IcMoon, IcLock
} from "../lib/icons";

const MOBILE_NAV = [
  { to: "/",             icon: IcHome,     label: "Accueil" },
  { to: "/transactions", icon: IcList,     label: "Opérations" },
  { to: "/import",       icon: IcImport,   label: "Importer" },
  { to: "/alerts",       icon: IcBell,     label: "Alertes" },
  { to: "/categories",   icon: IcTag,      label: "Catégories" },
];

const BASE_NAV = [
  { to: "/",             icon: IcHome,     label: "Tableau" },
  { to: "/import",       icon: IcImport,   label: "Importer" },
  { to: "/transactions", icon: IcList,     label: "Transactions" },
  { to: "/categories",   icon: IcTag,      label: "Catégories" },
  { to: "/evolution",    icon: IcChart,    label: "Évolution" },
  { to: "/alerts",       icon: IcBell,     label: "Alertes" },
  { to: "/settings",     icon: IcSettings, label: "Paramètres" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => load("stg.theme", "clair"));
  const [unread, setUnread] = useState(() => {
    const a = load("alerts", []);
    return a.filter(x => x.state === "unread").length;
  });

  useEffect(() => {
    const handler = e => {
      if (e.detail?.key === "stg.theme") setTheme(e.detail.value);
      if (e.detail?.key === "alerts") setUnread((e.detail.value || []).filter(x => x.state === "unread").length);
    };
    window.addEventListener("ambre:storage", handler);
    return () => window.removeEventListener("ambre:storage", handler);
  }, []);

  const navItems = BASE_NAV.map(item =>
    item.to === "/alerts" && unread > 0 ? { ...item, badge: unread } : item
  );

  function toggleTheme() {
    const next = theme === "sombre" ? "clair" : "sombre";
    save("stg.theme", next);
    setTheme(next);
    window.dispatchEvent(new CustomEvent("ambre:storage", { detail: { key: "stg.theme", value: next } }));
  }

  const isDark = theme === "sombre" ||
    (theme === "auto" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  function lockNow() {
    const phrase = load("stg.lockPhrase", "");
    if (!phrase) { navigate("/settings"); return; }
    save("app.locked", true);
    window.dispatchEvent(new CustomEvent("ambre:storage", { detail: { key: "app.locked", value: true } }));
  }

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
        <button
          className="atc-nav-btn"
          title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
          onClick={toggleTheme}
        >
          {isDark ? <IcMoon size={18}/> : <IcSun size={18}/>}
        </button>
        <button className="atc-nav-btn" title="Verrouiller" onClick={lockNow}><IcLock size={16}/></button>
      </div>
    </aside>
  );
}

/* Navigation fixe en bas — visible uniquement sur mobile (≤768 px) */
export function BottomNav() {
  const [unread, setUnread] = useState(() => {
    const a = load("alerts", []);
    return a.filter(x => x.state === "unread").length;
  });

  useEffect(() => {
    const handler = e => {
      if (e.detail?.key === "alerts")
        setUnread((e.detail.value || []).filter(x => x.state === "unread").length);
    };
    window.addEventListener("ambre:storage", handler);
    return () => window.removeEventListener("ambre:storage", handler);
  }, []);

  return (
    <nav className="atc-bnav">
      <style>{`
        .atc-bnav {
          display: none;
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 60px;
          background: var(--cream-50);
          border-top: 1px solid var(--line);
          z-index: 200;
          padding-bottom: env(safe-area-inset-bottom, 0px);
        }
        .atc-bnav-item {
          flex: 1;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          gap: 3px;
          font-size: 10px;
          color: var(--ink-500);
          text-decoration: none;
          position: relative;
          transition: color 0.15s;
        }
        .atc-bnav-item.active { color: var(--amber-500); }
        .atc-bnav-item .bdg {
          position: absolute;
          top: 8px; right: calc(50% - 14px);
          width: 6px; height: 6px;
          border-radius: 999px;
          background: var(--rose-500);
        }
        @media (max-width: 768px) {
          .atc-bnav { display: flex; }
        }
      `}</style>

      {MOBILE_NAV.map(it => {
        const Ico = it.icon;
        const badge = it.to === "/alerts" && unread > 0;
        return (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === "/"}
            className={({ isActive }) => "atc-bnav-item" + (isActive ? " active" : "")}
          >
            <Ico size={20}/>
            <span>{it.label}</span>
            {badge && <span className="bdg"/>}
          </NavLink>
        );
      })}
    </nav>
  );
}
