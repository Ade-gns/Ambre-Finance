import { useState, useEffect, useCallback } from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { load, useLocalStorage } from "./lib/storage";
import { useTransactions, useCategories, useAlertDefs, computeAlertNotifs, mergeAlertNotifs } from "./lib/store";
import Sidebar, { BottomNav } from "./components/Sidebar";
import Dashboard from "./screens/Dashboard";
import Import from "./screens/Import";
import Transactions from "./screens/Transactions";
import Categories from "./screens/Categories";
import Evolution from "./screens/Evolution";
import Settings from "./screens/Settings";
import Alerts from "./screens/Alerts";
import Onboarding from "./screens/Onboarding";
import CommandPalette from "./components/CommandPalette";

/* Évalue les alertes à chaque changement de transactions et les persiste */
function AlertEngine() {
  const [transactions] = useTransactions();
  const [categories]   = useCategories();
  const [alertDefs]    = useAlertDefs();
  const [, setAlerts]  = useLocalStorage("alerts", []);

  useEffect(() => {
    if (!transactions?.length) return;
    const computed = computeAlertNotifs(transactions, categories, alertDefs);
    if (!computed.length) return;
    setAlerts(prev => mergeAlertNotifs(prev, computed));
  }, [transactions, categories, alertDefs]); // eslint-disable-line

  return null;
}

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
    <>
      <div className="main-layout">
        <Sidebar />
        <div className="main-content">
          {children}
        </div>
      </div>
      <BottomNav />
    </>
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

function PaletteListener({ onOpen }) {
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === "p") { e.preventDefault(); onOpen(); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onOpen]);
  return null;
}

export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);

  return (
    <HashRouter>
      <ThemeWatcher />
      <AlertEngine />
      <PaletteListener onOpen={openPalette} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
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
