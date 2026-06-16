# Palette de commandes (Ctrl+P) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter une palette de commandes accessible via `Ctrl+P` qui permet de rechercher des transactions/catégories et de déclencher 4 actions rapides sans naviguer manuellement.

**Architecture:** Un nouveau composant `CommandPalette.jsx` est rendu dans `App.jsx` avec un état `paletteOpen` local et un listener `Ctrl+P` sur `document`. La navigation depuis la palette vers Transactions ou Catégories passe par `{ state: ... }` de React Router, que les écrans cibles lisent au montage via `useLocation()`.

**Tech Stack:** React 19, React Router 7 (`useNavigate`, `useLocation`), CSS inline vars (`--cream-50`, `--amber-500`, etc.), `useTransactions` / `useCategories` depuis `src/lib/store.js`, `fmtEUR` depuis `src/lib/chartPrimitives.jsx`.

---

## Fichiers

| Statut | Fichier | Rôle |
|--------|---------|------|
| Créer | `src/components/CommandPalette.jsx` | Composant palette : overlay, recherche, actions, nav clavier |
| Modifier | `src/App.jsx` | État `paletteOpen` + listener `Ctrl+P` + rendu de la palette |
| Modifier | `src/screens/Transactions.jsx` | Lit `location.state.selectedTxId` et `location.state.openAddForm` |
| Modifier | `src/screens/Categories.jsx` | Lit `location.state.selectedCatId` et `location.state.openCreateForm` |

---

## Task 1 : Créer `src/components/CommandPalette.jsx`

**Fichiers :**
- Créer : `src/components/CommandPalette.jsx`

Ce composant est autonome : il reçoit `open` et `onClose` en props, gère sa propre recherche et sa navigation, et retourne `null` quand il est fermé.

- [ ] **Étape 1 : Créer le fichier avec le contenu complet**

Créer `src/components/CommandPalette.jsx` :

```jsx
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions, useCategories } from "../lib/store";
import { fmtEUR } from "../lib/chartPrimitives";

const ACTIONS = [
  { kind: "action", id: "import",  label: "Importer un relevé bancaire", sub: "CSV, OFX…",              icon: "↑" },
  { kind: "action", id: "add-tx",  label: "Ajouter une transaction",      sub: "Saisie manuelle",        icon: "+" },
  { kind: "action", id: "add-cat", label: "Créer une catégorie",          sub: "Avec règle optionnelle", icon: "⊕" },
  { kind: "action", id: "export",  label: "Exporter mes données",         sub: "CSV",                    icon: "↓" },
];

export default function CommandPalette({ open, onClose }) {
  const navigate = useNavigate();
  const [transactions] = useTransactions();
  const [categories]   = useCategories();
  const [query, setQuery]           = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  const catMap = useMemo(
    () => Object.fromEntries(categories.map(c => [c.id, c])),
    [categories]
  );

  // Réinitialise et focus à l'ouverture
  useEffect(() => {
    if (!open) return;
    setQuery("");
    setSelectedIndex(0);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  // Construit la liste plate des lignes selon la requête courante
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ACTIONS;
    const txRows = transactions
      .filter(t => (t.lbl || "").toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({ kind: "tx", id: t.id, label: t.lbl, data: t }));
    const catRows = categories
      .filter(c => c.id !== "inc" && c.label.toLowerCase().includes(q))
      .slice(0, 3)
      .map(c => ({ kind: "cat", id: c.id, label: c.label, data: c }));
    return [...txRows, ...catRows];
  }, [query, transactions, categories]);

  // Navigation clavier
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIndex(i => Math.min(i + 1, rows.length - 1)); }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSelectedIndex(i => Math.max(i - 1, 0)); }
      if (e.key === "Enter")     { e.preventDefault(); execute(rows[selectedIndex]); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, rows, selectedIndex]); // eslint-disable-line

  const execute = (row) => {
    if (!row) return;
    if (row.kind === "action") {
      handleAction(row.id);
    } else if (row.kind === "tx") {
      navigate("/transactions", { state: { selectedTxId: row.id } });
      onClose();
    } else if (row.kind === "cat") {
      navigate("/categories", { state: { selectedCatId: row.id } });
      onClose();
    }
  };

  const handleAction = (id) => {
    if (id === "import") {
      navigate("/import");
      onClose();
      return;
    }
    if (id === "add-tx") {
      navigate("/transactions", { state: { openAddForm: true } });
      onClose();
      return;
    }
    if (id === "add-cat") {
      navigate("/categories", { state: { openCreateForm: true } });
      onClose();
      return;
    }
    if (id === "export") {
      const header = "Date,Libellé,Compte,Catégorie,Mode,Montant";
      const csvRows = transactions.map(t =>
        [t.d, `"${t.lbl}"`, t.acc, t.cat, t.mode, t.amt].join(",")
      );
      const blob = new Blob([header + "\n" + csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = "ambre-export.csv"; a.style.display = "none";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onClose();
    }
  };

  const highlightMatch = (text) => {
    const q = query.trim().toLowerCase();
    if (!q || !text) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx === -1) return text;
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: "var(--amber-500)", fontWeight: 600 }}>
          {text.slice(idx, idx + q.length)}
        </strong>
        {text.slice(idx + q.length)}
      </>
    );
  };

  if (!open) return null;

  const isSearching = query.trim().length > 0;
  const txRows  = rows.filter(r => r.kind === "tx");
  const catRows = rows.filter(r => r.kind === "cat");
  const noResults = isSearching && rows.length === 0;

  const renderRow = (row, index, label, sub, dotColor) => {
    const active = index === selectedIndex;
    return (
      <div
        key={row.kind + row.id}
        onClick={() => execute(row)}
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: active ? "8px 18px 8px 16px" : "8px 18px",
          borderLeft: active ? "2px solid var(--amber-500)" : "2px solid transparent",
          background: active ? "var(--amber-100)" : "transparent",
          cursor: "pointer",
        }}
      >
        <div style={{
          width: 26, height: 26, flexShrink: 0,
          borderRadius: dotColor ? "50%" : 6,
          background: dotColor || "var(--cream-200)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "var(--ink-600)",
        }}>
          {!dotColor && (row.icon || "›")}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--ink-900)" }}>{label}</div>
          <div style={{ fontSize: 11, color: "var(--ink-500)", marginTop: 1 }}>{sub}</div>
        </div>
        <span style={{ fontSize: 11, color: "var(--ink-400)", flexShrink: 0 }}>›</span>
      </div>
    );
  };

  const actionSection = !isSearching && (
    <>
      <div style={groupLabelStyle}>Actions rapides</div>
      {ACTIONS.map((a, i) => renderRow(a, i, a.label, a.sub, null))}
    </>
  );

  const txSection = isSearching && txRows.length > 0 && (
    <>
      <div style={groupLabelStyle}>
        Transactions · {txRows.length} résultat{txRows.length > 1 ? "s" : ""}
      </div>
      {txRows.map((r, i) => {
        const cat = catMap[r.data.cat];
        return renderRow(r, i, highlightMatch(r.label),
          `${r.data.d} · ${cat?.label || r.data.cat} · ${fmtEUR(r.data.amt)}`,
          cat?.color || "var(--cream-300)"
        );
      })}
    </>
  );

  const catSection = isSearching && catRows.length > 0 && (
    <>
      <div style={groupLabelStyle}>
        Catégories · {catRows.length} résultat{catRows.length > 1 ? "s" : ""}
      </div>
      {catRows.map((r, i) => renderRow(r, txRows.length + i, highlightMatch(r.label), "Catégorie", r.data.color))}
    </>
  );

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "var(--overlay-scrim)",
        backdropFilter: "blur(3px)",
        display: "flex", flexDirection: "column", alignItems: "center",
        paddingTop: 120,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 580, background: "var(--cream-50)",
          borderRadius: 14,
          boxShadow: "0 24px 60px rgba(42,28,16,0.40), 0 0 0 1px var(--line-strong)",
          overflow: "hidden", maxHeight: 560,
          display: "flex", flexDirection: "column",
          fontFamily: "var(--font-ui)",
        }}
      >
        {/* Barre de recherche */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 18px", borderBottom: "1px solid var(--line)",
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="var(--ink-500)" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="11" cy="11" r="7"/><path d="M16.5 16.5l4 4"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0); }}
            placeholder="Rechercher une transaction, une catégorie…"
            style={{
              flex: 1, border: "none", outline: "none", background: "transparent",
              fontFamily: "var(--font-ui)", fontSize: 15, color: "var(--ink-900)",
            }}
          />
          <span style={{
            fontSize: 10, color: "var(--ink-500)", fontFamily: "var(--font-mono)",
            background: "var(--cream-200)", padding: "2px 7px",
            borderRadius: 5, border: "1px solid var(--line)",
          }}>Ctrl+P</span>
        </div>

        {/* Résultats */}
        <div style={{ overflow: "auto", flex: 1 }}>
          {actionSection}
          {txSection}
          {catSection}
          {noResults && (
            <div style={{ padding: "32px 18px", textAlign: "center", color: "var(--ink-500)", fontSize: 13 }}>
              Aucun résultat pour « {query} »
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 18px", borderTop: "1px solid var(--line)",
          background: "var(--cream-100)", fontSize: 10, color: "var(--ink-500)",
          fontFamily: "var(--font-mono)", display: "flex", gap: 16,
        }}>
          <span>↑↓ naviguer</span><span>↩ ouvrir</span><span>Esc fermer</span>
        </div>
      </div>
    </div>
  );
}

const groupLabelStyle = {
  padding: "8px 18px 3px",
  fontSize: 10, color: "var(--ink-500)",
  letterSpacing: "0.1em", textTransform: "uppercase",
  fontFamily: "var(--font-mono)",
};
```

- [ ] **Étape 2 : Vérifier qu'il n'y a pas d'erreur de syntaxe**

```bash
cd /home/adelphe/Git/Ambre-Finance && npm run build 2>&1 | tail -20
```

Résultat attendu : build réussi (pas d'erreur sur `CommandPalette.jsx`). Si erreur, corriger avant de continuer.

- [ ] **Étape 3 : Commit**

```bash
git add src/components/CommandPalette.jsx
git commit -m "feat(palette): composant CommandPalette — overlay, recherche, actions"
```

---

## Task 2 : Intégrer la palette dans `src/App.jsx`

**Fichiers :**
- Modifier : `src/App.jsx`

- [ ] **Étape 1 : Ajouter l'import de CommandPalette**

Dans `src/App.jsx`, après la ligne `import Onboarding from "./screens/Onboarding";` (ligne 13), ajouter :

```jsx
import CommandPalette from "./components/CommandPalette";
```

- [ ] **Étape 2 : Ajouter l'état et le listener dans la fonction `App`**

Remplacer le corps de la fonction `App` (lignes 89–109) par :

```jsx
export default function App() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <HashRouter>
      <ThemeWatcher />
      <AlertEngine />
      <PaletteListener onOpen={() => setPaletteOpen(true)} />
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
```

- [ ] **Étape 3 : Ajouter le composant `PaletteListener` avant la fonction `App`**

Insérer ce composant juste avant `export default function App()` :

```jsx
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
```

`PaletteListener` est un composant séparé (et non un `useEffect` dans `App`) pour éviter une closure stale sur `onOpen` — le composant capture toujours la dernière version du callback.

- [ ] **Étape 4 : Vérifier manuellement**

```bash
npm run dev
```

Ouvrir http://localhost:1420, appuyer sur `Ctrl+P` : la palette doit s'ouvrir avec les 4 actions. Appuyer sur `Escape` : elle se ferme. Cliquer en dehors du modal : elle se ferme.

- [ ] **Étape 5 : Commit**

```bash
git add src/App.jsx
git commit -m "feat(palette): intégration Ctrl+P dans App.jsx"
```

---

## Task 3 : `src/screens/Transactions.jsx` — réagir au `location.state`

**Fichiers :**
- Modifier : `src/screens/Transactions.jsx`

Deux comportements à ajouter :
1. Si `location.state.selectedTxId` est présent → ouvrir le panneau de détail sur cette transaction.
2. Si `location.state.openAddForm` est présent → ouvrir le modal d'ajout.

- [ ] **Étape 1 : Ajouter l'import `useLocation`**

Ligne 7 de `Transactions.jsx`, remplacer :

```jsx
import { useNavigate } from "react-router-dom";
```

par :

```jsx
import { useNavigate, useLocation } from "react-router-dom";
```

- [ ] **Étape 2 : Lire `location.state` dans le composant `Transactions` et passer les props**

Dans la fonction `Transactions` (démarre ligne 67), ajouter `useLocation()` et un `useEffect` qui réagit au state. Remplacer le début de la fonction jusqu'à la ligne `return (` par :

```jsx
export default function Transactions() {
  const location = useLocation();
  const [transactions] = useTransactions();
  const [selectedTx, setSelectedTx] = useState(null);
  const [bulkMode, setBulkMode]     = useState(false);
  const bulkStartRef                = useRef(null);

  const openDetail  = tx  => { setSelectedTx(tx); setBulkMode(false); };
  const closeDetail = ()  => setSelectedTx(null);
  const openBulk    = (startIdx = null) => {
    bulkStartRef.current = startIdx;
    setBulkMode(true);
    setSelectedTx(null);
  };
  const closeBulk = () => setBulkMode(false);

  // Réagit aux navigations depuis la palette de commandes
  useEffect(() => {
    const s = location.state;
    if (!s) return;
    if (s.selectedTxId) {
      const tx = transactions.find(t => String(t.id) === String(s.selectedTxId));
      if (tx) openDetail(tx);
    }
  }, []); // eslint-disable-line — se déclenche une seule fois au montage
```

Note : `useTransactions` est déjà importé via le hook existant. Ajouter son destructuring ici car il était absent du composant racine (il était seulement dans `TxDefault`).

- [ ] **Étape 3 : Passer `autoOpenAdd` à `TxDefault`**

Dans le `return` de `Transactions`, remplacer :

```jsx
<TxDefault onRowClick={openDetail} onSelectMany={openBulk}/>
```

par :

```jsx
<TxDefault onRowClick={openDetail} onSelectMany={openBulk} autoOpenAdd={!!location.state?.openAddForm}/>
```

- [ ] **Étape 4 : Lire `autoOpenAdd` dans `TxDefault`**

Dans la signature de `TxDefault` (ligne ~664), ajouter le prop :

```jsx
function TxDefault({ onRowClick, onSelectMany, autoOpenAdd }) {
```

Puis, dans le corps de `TxDefault`, juste après la déclaration `const [showAddModal, setShowAddModal] = useState(false);` (ligne ~667), ajouter :

```jsx
useEffect(() => { if (autoOpenAdd) setShowAddModal(true); }, []); // eslint-disable-line
```

- [ ] **Étape 5 : Vérifier manuellement**

```bash
npm run dev
```

1. Ouvrir `Ctrl+P`, taper un libellé de transaction (ex. "carref"), cliquer sur un résultat → l'écran Transactions s'ouvre avec le panneau de détail de cette transaction.
2. Ouvrir `Ctrl+P`, cliquer "Ajouter une transaction" → l'écran Transactions s'ouvre avec le modal de saisie déjà ouvert.

- [ ] **Étape 6 : Commit**

```bash
git add src/screens/Transactions.jsx
git commit -m "feat(palette): Transactions réagit à location.state (selectedTxId, openAddForm)"
```

---

## Task 4 : `src/screens/Categories.jsx` — réagir au `location.state`

**Fichiers :**
- Modifier : `src/screens/Categories.jsx`

Deux comportements :
1. Si `location.state.selectedCatId` → pré-sélectionner cette catégorie.
2. Si `location.state.openCreateForm` → ouvrir le formulaire de création.

- [ ] **Étape 1 : Ajouter l'import `useLocation`**

Ligne 6 de `Categories.jsx`, remplacer :

```jsx
import { useNavigate } from "react-router-dom";
```

par :

```jsx
import { useNavigate, useLocation } from "react-router-dom";
```

- [ ] **Étape 2 : Lire `location.state` dans le composant `Categories` et propager**

Dans la fonction `Categories` (ligne ~25), remplacer les deux premières lignes du corps :

```jsx
const [view, setView]                   = useState("manage");
const [selectedCatId, setSelectedCatId] = useState(() => categories[0]?.id || "alim");
```

par :

```jsx
const { state } = useLocation();
const [view, setView]                   = useState("manage");
const [selectedCatId, setSelectedCatId] = useState(
  () => state?.selectedCatId || categories[0]?.id || "alim"
);
```

- [ ] **Étape 3 : Passer `autoOpenCreate` à `CatManage`**

Dans le `return` de `Categories`, remplacer :

```jsx
<CatManage
  selectedCatId={selectedCatId}
  onSelectCat={id => setSelectedCatId(id)}
  onSeeDetail={() => setView("detail")}
  onSeeEmpty={() => setView("empty")}
  catsWithAmounts={catsWithAmounts}
  setCategories={setCategories}
/>
```

par :

```jsx
<CatManage
  selectedCatId={selectedCatId}
  onSelectCat={id => setSelectedCatId(id)}
  onSeeDetail={() => setView("detail")}
  onSeeEmpty={() => setView("empty")}
  catsWithAmounts={catsWithAmounts}
  setCategories={setCategories}
  autoOpenCreate={!!state?.openCreateForm}
/>
```

- [ ] **Étape 4 : Lire `autoOpenCreate` dans `CatManage`**

Dans la signature de `CatManage` (ligne ~80), ajouter le prop :

```jsx
function CatManage({ selectedCatId, onSelectCat, onSeeDetail, onSeeEmpty, catsWithAmounts = [], setCategories, autoOpenCreate }) {
```

Puis, juste après `const [newOpen, setNewOpen] = useState(false);` (ligne ~81), ajouter :

```jsx
useEffect(() => { if (autoOpenCreate) setNewOpen(true); }, []); // eslint-disable-line
```

- [ ] **Étape 5 : Vérifier manuellement**

```bash
npm run dev
```

1. Ouvrir `Ctrl+P`, taper le nom d'une catégorie (ex. "alim"), cliquer sur le résultat → l'écran Catégories s'ouvre avec cette catégorie sélectionnée.
2. Ouvrir `Ctrl+P`, cliquer "Créer une catégorie" → l'écran Catégories s'ouvre avec le formulaire de nouvelle catégorie déjà ouvert.

- [ ] **Étape 6 : Commit final**

```bash
git add src/screens/Categories.jsx
git commit -m "feat(palette): Categories réagit à location.state (selectedCatId, openCreateForm)"
```

---

## Vérification finale

- [ ] Build propre : `npm run build` sans erreur
- [ ] `Ctrl+P` depuis n'importe quel écran → palette s'ouvre
- [ ] État vide → 4 actions visibles
- [ ] Recherche "carref" → transactions Carrefour avec portion en orange
- [ ] Recherche "alim" → catégorie Alimentation + transactions matchantes
- [ ] Aucun résultat → message "Aucun résultat pour « … »"
- [ ] `↑` `↓` naviguent dans la liste, `Enter` exécute
- [ ] `Escape` et clic dehors ferment la palette
- [ ] Action "Importer" → navigue vers `/import`
- [ ] Action "Ajouter une transaction" → modal de saisie ouvert sur `/transactions`
- [ ] Action "Créer une catégorie" → formulaire ouvert sur `/categories`
- [ ] Action "Exporter" → télécharge `ambre-export.csv`
- [ ] Clic sur transaction → panneau de détail ouvert sur `/transactions`
- [ ] Clic sur catégorie → catégorie sélectionnée sur `/categories`
- [ ] Mode sombre : palette respecte `[data-theme="dark"]` via les CSS vars
