# Fichiers JSX d'origine (référence)

Ces fichiers proviennent de ton export Claude Design. Ils sont **conservés tels quels**
pour servir de référence visuelle/comportementale pendant l'intégration.

⚠️ **Ces fichiers NE sont PAS utilisés directement par l'app.**
Ils utilisent une convention `window.AMBRE_DATA` + globales (pas d'imports/exports ES).

Ils servent de **source** pour convertir chaque écran en module propre dans `src/screens/`.

## Correspondance fichier → écran

| Fichier | Écran |
|---|---|
| `00-onboarding.jsx` | Premier lancement |
| `01-dashboard.jsx` | Tableau de bord (rempli) — **déjà intégré** dans `src/screens/Dashboard.jsx` |
| `01-dashboard-empty.jsx` | Tableau de bord (vide) |
| `02-import-empty.jsx` | Import - état vide (drop zone) |
| `02-import-preview.jsx` | Import - aperçu après dépôt |
| `02-import-success.jsx` | Import - succès |
| `02-import-error.jsx` | Import - erreur |
| `03-transactions.jsx` | Liste des transactions (4 variantes) |
| `04-category-detail.jsx` | Vue par catégorie (drill-down) |
| `04-category-empty.jsx` | Vue catégorie - état vide |
| `05-evolution.jsx` | Évolution mensuelle |
| `06-categories-manage.jsx` | Gestion des catégories |
| `07-settings-alerts.jsx` | Paramètres - Alertes |
| `07-settings-sub-screens.jsx` | Paramètres - sous-écrans (Général, Comptes, etc.) |
| `08-alerts-history.jsx` | Historique des alertes |
| `09-overlay-budget-modal.jsx` | Modal "Définir un budget" |
| `09-overlay-command-palette.jsx` | Recherche ⌘K |
| `_data.js` | Mock data (déjà repris dans `src/data/mockData.js`) |
| `_icons.jsx` | Icônes SVG (déjà repris dans `src/lib/icons.jsx`) |
| `_chart-primitives.jsx` | Primitives graphiques (déjà repris dans `src/lib/chartPrimitives.jsx`) |
| `_app-entrypoint.jsx` | App d'origine (canvas Figma — non utile en prod) |
