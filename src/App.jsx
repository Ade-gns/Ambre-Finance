// App.jsx — Routeur principal + layout.
// L'écran Onboarding est plein écran (pas de sidebar) parce que l'app n'est pas encore initialisée.
// Tous les autres écrans utilisent le Layout standard avec sidebar.

import { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { load } from "./lib/storage";
import Sidebar from "./components/Sidebar";
import Dashboard from "./screens/Dashboard";
import Import from "./screens/Import";
import Transactions from "./screens/Transactions";
import Categories from "./screens/Categories";
import Evolution from "./screens/Evolution";
import Settings from "./screens/Settings";
import Alerts from "./screens/Alerts";
import Onboarding from "./screens/Onboarding";

/* Applique data-theme sur <html> selon le choix stocké */
function ThemeWatcher() {
  const [theme, setTheme] = useState(() => load("stg.theme", "clair"));

  useEffect(() => {
    const handler = e => {
      if (e.detail?.key === "stg.theme") setTheme(e.detail.value);
    };
    window.addEventListener("ambre:storage", handler);
    return () => window.removeEventListener("ambre:storage", handler);
  }, []);

  useEffect(() => {
    function apply(t) {
      const dark = t === "sombre" ||
        (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    }
    apply(theme);
    if (theme === "auto") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => apply("auto");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, [theme]);

  return null;
}

/* Layout standard : sidebar à gauche + contenu à droite */
function MainLayout({ children }) {
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "var(--page-bg)",
      color: "var(--ink-800)",
      display: "grid",
      gridTemplateColumns: "72px 1fr",
      fontSize: 13,
      overflow: "hidden",
    }}>
      <Sidebar />
      <div style={{ overflow: "auto", height: "100vh" }}>
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeWatcher />
      <Routes>
        {/* Route plein écran — pas de sidebar */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Routes standard — avec sidebar */}
        <Route path="/" element={<MainLayout><Dashboard /></MainLayout>} />
        <Route path="/import" element={<MainLayout><Import /></MainLayout>} />
        <Route path="/transactions" element={<MainLayout><Transactions /></MainLayout>} />
        <Route path="/categories" element={<MainLayout><Categories /></MainLayout>} />
        <Route path="/evolution" element={<MainLayout><Evolution /></MainLayout>} />
        <Route path="/alerts" element={<MainLayout><Alerts /></MainLayout>} />
        <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
      </Routes>
    </HashRouter>
  );
}
