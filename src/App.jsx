// App.jsx — Routeur principal + layout.
// L'écran Onboarding est plein écran (pas de sidebar) parce que l'app n'est pas encore initialisée.
// Tous les autres écrans utilisent le Layout standard avec sidebar.

import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { load } from "./lib/storage";
import { useTransactions } from "./lib/store";
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

function DataGuard({ children }) {
  const [transactions] = useTransactions();
  if (!transactions || transactions.length === 0) return <Navigate to="/onboarding" replace />;
  return children;
}

function OnboardingRoute() {
  const [transactions] = useTransactions();
  if (transactions && transactions.length > 0) return <Navigate to="/" replace />;
  return <Onboarding />;
}

export default function App() {
  return (
    <HashRouter>
      <ThemeWatcher />
      <Routes>
        {/* Route plein écran — pas de sidebar */}
        <Route path="/onboarding" element={<OnboardingRoute />} />

        {/* Routes standard — avec sidebar */}
        <Route path="/" element={<DataGuard><MainLayout><Dashboard /></MainLayout></DataGuard>} />
        <Route path="/import" element={<MainLayout><Import /></MainLayout>} />
        <Route path="/transactions" element={<DataGuard><MainLayout><Transactions /></MainLayout></DataGuard>} />
        <Route path="/categories" element={<DataGuard><MainLayout><Categories /></MainLayout></DataGuard>} />
        <Route path="/evolution" element={<DataGuard><MainLayout><Evolution /></MainLayout></DataGuard>} />
        <Route path="/alerts" element={<DataGuard><MainLayout><Alerts /></MainLayout></DataGuard>} />
        <Route path="/settings" element={<MainLayout><Settings /></MainLayout>} />
      </Routes>
    </HashRouter>
  );
}
