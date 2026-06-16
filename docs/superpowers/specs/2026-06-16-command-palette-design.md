# Palette de commandes (Ctrl+P)

**Date :** 2026-06-16

## Objectif

Ajouter une palette de commandes accessible via `Ctrl+P` qui permet de rechercher des transactions et des catégories, et de déclencher les actions courantes sans naviguer vers un écran spécifique.

## Priorités

1. **Recherche** — trouver une transaction par libellé ou une catégorie par nom
2. **Actions rapides** — importer, ajouter, créer, exporter
3. **Navigation** — secondaire, non implémentée dans cette version

## Comportement

### Ouverture / fermeture

- `Ctrl+P` ouvre la palette depuis n'importe quel écran
- `Escape` ou clic en dehors du modal la ferme
- Overlay `position: fixed; inset: 0` avec backdrop semi-transparent et `backdrop-filter: blur(3px)`

### État initial (aucun texte tapé)

Affiche directement les **4 actions rapides** :

| Icône | Label | Comportement |
|-------|-------|--------------|
| ↑ | Importer un relevé bancaire | `navigate('/import')` |
| + | Ajouter une transaction | `navigate('/transactions', { state: { openAddForm: true } })` |
| ⊕ | Créer une catégorie | `navigate('/categories', { state: { openCreateForm: true } })` |
| ↓ | Exporter mes données | Déclenche l'export CSV existant |

### Recherche active (texte tapé)

Remplace les actions par des résultats groupés :

- **Transactions** — filtre sur `t.label` (libellé), case-insensitive, max 5 résultats. Affiche : libellé avec portion matchée en gras coloré, date + catégorie + montant. Clic → `navigate('/transactions', { state: { selectedTxId: t.id } })` ; l'écran Transactions lit `location.state.selectedTxId` au montage pour ouvrir le panneau de détail sur cette transaction.
- **Catégories** — filtre sur `c.label`, max 3 résultats. Affiche : nom + dépenses du mois en cours. Clic → `navigate('/categories', { state: { selectedCatId: c.id } })` ; l'écran Catégories lit `location.state.selectedCatId` au montage pour sélectionner la catégorie.
- Si un groupe n'a aucun résultat, son en-tête reste visible avec le texte "Aucun résultat".
- Pas de debounce — toutes les données sont en mémoire, le filtrage est synchrone.
- La portion matchée est mise en évidence dans le libellé (ex. **Carref**our Market).

### Navigation clavier

| Touche | Action |
|--------|--------|
| `↑` / `↓` | Déplace la sélection dans la liste |
| `Enter` | Exécute l'action ou ouvre la transaction/catégorie sélectionnée |
| `Escape` | Ferme la palette |

La première ligne de la liste est sélectionnée par défaut à l'ouverture.

## Architecture

### Fichiers

- **Nouveau :** `src/components/CommandPalette.jsx` — composant autonome
- **Modifié :** `src/App.jsx` — état + listener clavier + rendu du composant

### Intégration dans App.jsx

```jsx
const [paletteOpen, setPaletteOpen] = useState(false);

useEffect(() => {
  const handler = (e) => {
    if (e.ctrlKey && e.key === 'p') { e.preventDefault(); setPaletteOpen(true); }
    if (e.key === 'Escape') setPaletteOpen(false);
  };
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}, []);

// Dans le JSX :
<CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
```

### Structure de CommandPalette.jsx

- Props : `open: boolean`, `onClose: () => void`
- Hooks : `useTransactions()`, `useCategories()` pour les données
- `useNavigate()` pour la navigation
- État local : `query` (string), `selectedIndex` (number)
- Si `!open`, retourne `null`
- Rendu : overlay fixe → modal → input → liste de résultats → footer clavier

### Modifications des écrans cibles

Les écrans Transactions et Catégories lisent `useLocation().state` à leur montage pour réagir aux actions de la palette :

```jsx
// Transactions.jsx
const { state } = useLocation();
useEffect(() => {
  if (state?.selectedTxId) setSelectedId(state.selectedTxId);
  if (state?.openAddForm) setAddFormOpen(true);
}, []);

// Categories.jsx
const { state } = useLocation();
useEffect(() => {
  if (state?.selectedCatId) setSelectedCat(state.selectedCatId);
  if (state?.openCreateForm) setCreateFormOpen(true);
}, []);
```

## Ce qui n'est pas dans cette version

- Navigation vers les écrans (G T, G X, etc.) — pas prioritaire
- Raccourcis clavier dédiés par action (⌘I, ⌘N) — hors scope
- Recherche par montant (ex. "67€") — hors scope
- Onglets de filtre (Tout / Actions / Transactions / Paramètres) — hors scope
- Historique des recherches récentes — hors scope
