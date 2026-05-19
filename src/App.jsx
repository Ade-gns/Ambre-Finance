// App.jsx — Routeur principal + layout.
// L'écran Onboarding est plein écran (pas de sidebar) parce que l'app n'est pas encore initialisée.
// Tous les autres écrans utilisent le Layout standard avec sidebar.

import { HashRouter, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./screens/Dashboard";
import Import from "./screens/Import";
import Transactions from "./screens/Transactions";
import Categories from "./screens/Categories";
import Evolution from "./screens/Evolution";
import Settings from "./screens/Settings";
import Alerts from "./screens/Alerts";
import Onboarding from "./screens/Onboarding";

/* Layout standard : sidebar à gauche + contenu à droite */
function MainLayout({ children }) {
  return (
    <div style={{
      width: "100%",
      height: "100vh",
      background: "#efe7d6",
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
