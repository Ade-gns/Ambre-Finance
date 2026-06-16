# Ambre — Gestionnaire de finances personnelles

Application desktop open source pour suivre, analyser et comprendre vos dépenses. Construite avec Tauri 2, React 19 et SQLite.

---

## Fonctionnalités

### Tableau de bord
Vue mensuelle synthétique : total des dépenses, revenus, solde net, progression par rapport au mois précédent et jauge budgétaire. Graphique en barres des 12 derniers mois navigable mois par mois.

### Import
Importation de relevés bancaires au format CSV. Aperçu dynamique des transactions avant confirmation, avec détection automatique du séparateur et du format de date.

### Transactions
Liste complète de toutes les transactions avec recherche full-text, filtres par mois, catégorie et type (dépense / revenu). Sélection multiple pour actions groupées. Détail de chaque transaction avec ré-affectation de catégorie.

### Catégories
Gestion des catégories de dépenses avec couleur, budget mensuel et icône. Règles d'affectation automatique (libellé contient, montant >, etc.) activables/désactivables individuellement.

### Évolution
Vue panoramique sur le temps : graphique hero dépenses + revenus + année précédente, tableau de comparaison année par année, sparklines par catégorie (vue mensuelle ou cumulée).

### Alertes
Alertes paramétrables sur seuils (budget catégorie dépassé, solde bas, grosse transaction, etc.) avec historique des déclenchements.

### Paramètres
- **Général** : formats de montant et de date, fuseau horaire, écran d'accueil
- **Comptes** : gestion multi-comptes bancaires
- **Apparence** : thème clair / sombre / auto, couleur d'accent, densité d'affichage
- **Sauvegarde** : export et restauration des données

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Desktop shell | [Tauri 2](https://tauri.app) (Rust) |
| UI | React 19 + React Router 7 |
| Build | Vite 7 |
| Stockage | SQLite via `tauri-plugin-sql` (desktop) · localStorage (navigateur) |
| Style | CSS-in-JS inline + variables CSS custom properties |

L'application fonctionne aussi en mode navigateur pur (sans Tauri) avec localStorage comme fallback — utile pour le développement UI.

---

## Prérequis

### Pour le développement

- **Node.js** ≥ 18
- **Rust** (stable) — [rustup.rs](https://rustup.rs)
- **Tauri CLI** — installé automatiquement via npm

#### Linux (Ubuntu / Debian)
```bash
sudo apt update
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev \
  librsvg2-dev libssl-dev pkg-config
```

#### macOS
```bash
xcode-select --install
```

#### Windows
Installer [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) avec les workloads "Desktop development with C++".

---

## Lancer l'application

### 1. Cloner le dépôt

```bash
git clone https://github.com/Ade-gns/Ambre-Finance.git
cd Ambre-Finance
```

### 2. Installer les dépendances JS

```bash
npm install
```

### 3a. Mode développement — application desktop complète

Lance Vite + la compilation Rust + la fenêtre Tauri. La première compilation Rust prend plusieurs minutes (les suivantes sont rapides grâce au cache).

```bash
npm run tauri -- dev
```

> **Linux avec Snap** : si vous obtenez une erreur `symbol lookup error: libpthread`, lancez depuis un terminal système (pas le terminal intégré à VS Code snap) ou préfixez la commande :
> ```bash
> export LD_LIBRARY_PATH=/lib/x86_64-linux-gnu:/usr/lib/x86_64-linux-gnu
> npm run tauri -- dev
> ```

### 3b. Mode développement — navigateur uniquement (UI seule)

Sans Rust, sans compilation, démarrage instantané. Les données sont stockées dans le localStorage du navigateur.

```bash
npm run dev
```

Ouvrir [http://localhost:1420](http://localhost:1420) dans le navigateur.

### 4. Build de production

```bash
npm run tauri -- build
```

L'installeur est généré dans `src-tauri/target/release/bundle/`.

---

## Premier lancement

Au premier démarrage, l'écran **Onboarding** s'affiche. Deux options :

- **Importer un relevé CSV** — glisser-déposer ou sélectionner un fichier `.csv` exporté depuis votre banque.
- **Charger l'exemple** — charge 92 transactions fictives (fév.–mai 2026) pour explorer l'interface. Ces données sont automatiquement effacées au prochain redémarrage.

---

## Structure du projet

```
src/
├── lib/
│   ├── db.js               # Couche SQLite / localStorage (cache en mémoire)
│   ├── storage.js          # Hook useLocalStorage + fonctions save/load
│   ├── store.js            # État global transactions & catégories
│   ├── chartPrimitives.js  # Composants SVG réutilisables
│   └── icons.js            # Icônes SVG inline
├── screens/
│   ├── Dashboard.jsx
│   ├── Import.jsx
│   ├── Transactions.jsx
│   ├── Categories.jsx
│   ├── Evolution.jsx
│   ├── Alerts.jsx
│   ├── Settings.jsx
│   └── Onboarding.jsx
├── components/
│   └── Sidebar.jsx
├── App.jsx                 # Routeur + layouts + guards
└── main.jsx                # Point d'entrée — init SQLite avant le rendu

src-tauri/                  # Code Rust / config Tauri
```

---

## Changelog

### 2026-06-17 — Données fabriquées remplacées par de vraies données
Plusieurs écrans affichaient des chiffres statiques ou calculés avec des formules arbitraires au lieu des vraies données de l'utilisateur. Corrigé sur :
- **Transactions** : les `id` générés via `Date.now() + Math.random()` pouvaient entrer en collision (perte de précision flottante au-delà de 10¹² ms), ce qui empêchait de sélectionner plusieurs transactions et pouvait faire recatégoriser/supprimer la mauvaise ligne. Nouveau générateur d'id sans collision + migration automatique des données existantes.
- **Évolution** : le tableau de comparaison annuelle utilisait une formule inventée pour les chiffres de l'année précédente ; remplacé par un détail mois par mois avec dépenses/revenus/solde réels.
- **Alertes** : "déclenchées ce mois", le delta vs mois précédent, "alertes actives" et la liste de catégories du filtre étaient en dur ; tout est maintenant calculé depuis les vraies alertes et règles configurées.
- **Paramètres** : la liste de comptes (4 comptes fictifs au démarrage) est remplacée par une détection automatique depuis les transactions réelles (solde, dernier mouvement, nombre de transactions) ; les statistiques de sauvegarde (taille, date, intégrité) reflètent l'état réel au lieu de valeurs figées.
- **Catégories** : la fiche détail d'une catégorie (graphique 12 mois, total, % de budget, classement, marchands principaux) était presque entièrement fictive ; tout est recalculé depuis les vraies transactions. La carte "Sous-catégories" (qui ne correspond à aucun concept du modèle de données) est remplacée par une répartition réelle par mode de paiement. Les "suggestions" de transactions à classer (état vide d'une catégorie) proposent désormais de vraies transactions mal classées, avec un bouton de réaffectation fonctionnel.

### 2026-06-16 — Palette de commandes, tri, import et corrections diverses
- Ajout de la palette de commandes (`Ctrl+P`) avec recherche et navigation contextuelle.
- Tri par colonne sur l'écran Transactions (date, libellé, montant, catégorie, compte, mode).
- Import CSV : fallback d'encodage Windows-1252 / ISO-8859-1 pour les relevés bancaires français.
- Corrections : clé React instable sur les lignes de transactions, année précédente fabriquée sur le graphique d'évolution, CTA des alertes non cliquables, bouton "Désarchiver", actions de l'état vide d'une catégorie, écran de verrouillage et prénom personnalisable dans les Paramètres.

---

## Contribuer

Les contributions sont les bienvenues. Ouvrez une issue pour discuter d'une fonctionnalité avant de soumettre une PR.

Vérifier qu'il n'y a pas d'erreur de build avant de soumettre :
```bash
npm run build
```

---

## Licence

MIT
