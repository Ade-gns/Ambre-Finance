// App entrypoint — parcours complet + états + overlays.

const TWEAKS_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#b8693d",
  "showOnboarding": true,
  "showDashboard": true,
  "showDashboardEmpty": true,
  "showImportEmpty": true,
  "showImportPreview": true,
  "showImportSuccess": true,
  "showImportError": true,
  "showTxList": true,
  "showTxDetail": true,
  "showTxEmpty": true,
  "showTxBulk": true,
  "showCategoryDetail": true,
  "showCategoryEmpty": true,
  "showEvolution": true,
  "showCategoriesManage": true,
  "showSettingsAlerts": true,
  "showSettingsGeneral": true,
  "showSettingsAccounts": true,
  "showSettingsBackup": true,
  "showSettingsAppearance": true,
  "showSettingsAbout": true,
  "showAlertsHistory": true,
  "showBudgetModal": true,
  "showCommandPalette": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAKS_DEFAULTS);

  React.useEffect(() => {
    document.documentElement.style.setProperty("--amber-500", t.accent);
    const lighter = mix(t.accent, "#ffffff", 0.7);
    document.documentElement.style.setProperty("--amber-100", lighter);
  }, [t.accent]);

  return (
    <>
      <DesignCanvas
        title="Ambre · Application"
        subtitle="Direction Atelier Clair — desktop, palette ambrée. Parcours complet + états vides, erreurs et overlays.">

        <DCSection id="onboarding" title="00 · Onboarding">
          {t.showOnboarding && (
            <DCArtboard id="ob" label="Premier lancement — manifeste + premier import" width={1440} height={900}>
              <ScreenOnboarding/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="dashboard" title="01 · Tableau de bord">
          {t.showDashboardEmpty && (
            <DCArtboard id="dash-empty" label="A · État vide — premier lancement" width={1440} height={900}>
              <ScreenDashboardEmpty/>
            </DCArtboard>
          )}
          {t.showDashboard && (
            <DCArtboard id="dash" label="B · État rempli — vue d'ensemble du mois" width={1440} height={900}>
              <DashAtelierClair/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="import" title="02 · Import de relevés">
          {t.showImportEmpty && (
            <DCArtboard id="imp-empty" label="A · État vide — drop zone + historique" width={1440} height={900}>
              <ScreenImportEmpty/>
            </DCArtboard>
          )}
          {t.showImportPreview && (
            <DCArtboard id="imp-preview" label="B · Aperçu après extraction — table éditable" width={1440} height={900}>
              <ScreenImportPreview/>
            </DCArtboard>
          )}
          {t.showImportSuccess && (
            <DCArtboard id="imp-success" label="C · Succès — 47 transactions ajoutées" width={1440} height={900}>
              <ScreenImportSuccess/>
            </DCArtboard>
          )}
          {t.showImportError && (
            <DCArtboard id="imp-error" label="D · Erreur — format non reconnu + doublons + protégé" width={1440} height={900}>
              <ScreenImportError/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="transactions" title="03 · Liste des transactions">
          {t.showTxList && (
            <DCArtboard id="tx-list" label="A · Table filtrée et triée" width={1440} height={900}>
              <ScreenTransactions/>
            </DCArtboard>
          )}
          {t.showTxDetail && (
            <DCArtboard id="tx-detail" label="B · Avec panneau détail ouvert" width={1440} height={900}>
              <ScreenTransactionsDetail/>
            </DCArtboard>
          )}
          {t.showTxBulk && (
            <DCArtboard id="tx-bulk" label="C · Sélection multiple — actions en masse" width={1440} height={900}>
              <ScreenTransactionsBulk/>
            </DCArtboard>
          )}
          {t.showTxEmpty && (
            <DCArtboard id="tx-empty" label="D · État vide — aucun résultat sur la période" width={1440} height={900}>
              <ScreenTransactionsEmpty/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="category" title="04 · Vue par catégorie">
          {t.showCategoryDetail && (
            <DCArtboard id="cat-detail" label="A · Drill-down — Alimentation (rempli)" width={1440} height={900}>
              <ScreenCategoryDetail/>
            </DCArtboard>
          )}
          {t.showCategoryEmpty && (
            <DCArtboard id="cat-empty" label="B · État vide — Éducation (aucune dépense)" width={1440} height={900}>
              <ScreenCategoryEmpty/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="evolution" title="05 · Évolution mensuelle">
          {t.showEvolution && (
            <DCArtboard id="evol" label="Vue panoramique — 12 mois + small multiples" width={1440} height={900}>
              <ScreenEvolution/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="catmgr" title="06 · Gestion des catégories">
          {t.showCategoriesManage && (
            <DCArtboard id="cat-manage" label="Liste + éditeur + règles automatiques" width={1440} height={900}>
              <ScreenCategoriesManage/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="settings" title="07 · Paramètres">
          {t.showSettingsAlerts && (
            <DCArtboard id="s-alerts" label="Alertes · configuration" width={1440} height={900}>
              <ScreenSettingsAlerts/>
            </DCArtboard>
          )}
          {t.showSettingsGeneral && (
            <DCArtboard id="s-gen" label="Général" width={1440} height={900}>
              <ScreenSettingsGeneral/>
            </DCArtboard>
          )}
          {t.showSettingsAccounts && (
            <DCArtboard id="s-acc" label="Comptes & banques" width={1440} height={900}>
              <ScreenSettingsAccounts/>
            </DCArtboard>
          )}
          {t.showSettingsBackup && (
            <DCArtboard id="s-bck" label="Sauvegarde & données" width={1440} height={900}>
              <ScreenSettingsBackup/>
            </DCArtboard>
          )}
          {t.showSettingsAppearance && (
            <DCArtboard id="s-app" label="Apparence" width={1440} height={900}>
              <ScreenSettingsAppearance/>
            </DCArtboard>
          )}
          {t.showSettingsAbout && (
            <DCArtboard id="s-abt" label="À propos" width={1440} height={900}>
              <ScreenSettingsAbout/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="alerts-hist" title="08 · Historique des alertes">
          {t.showAlertsHistory && (
            <DCArtboard id="alerts-h" label="Journal des alertes déclenchées" width={1440} height={900}>
              <ScreenAlertsHistory/>
            </DCArtboard>
          )}
        </DCSection>

        <DCSection id="overlays" title="09 · Overlays & dialogs">
          {t.showBudgetModal && (
            <DCArtboard id="o-budget" label="Modal · Définir un budget (sur Dashboard)" width={1440} height={900}>
              <ScreenBudgetModal/>
            </DCArtboard>
          )}
          {t.showCommandPalette && (
            <DCArtboard id="o-cmd" label="Palette ⌘K · recherche globale (sur Transactions)" width={1440} height={900}>
              <ScreenCommandPalette/>
            </DCArtboard>
          )}
        </DCSection>
      </DesignCanvas>

      <TweaksPanel title="Tweaks · Ambre">
        <TweakSection title="Accent">
          <TweakColor
            label="Couleur d'accent"
            value={t.accent}
            onChange={v => setTweak("accent", v)}
            options={["#b8693d", "#a85a48", "#6b7a4f", "#3d2817", "#7a5c3a"]}
          />
        </TweakSection>

        <TweakSection title="Parcours">
          <TweakToggle label="00 · Onboarding"              value={t.showOnboarding}      onChange={v => setTweak("showOnboarding", v)}/>
          <TweakToggle label="01 · Dashboard — vide"        value={t.showDashboardEmpty}  onChange={v => setTweak("showDashboardEmpty", v)}/>
          <TweakToggle label="01 · Dashboard — rempli"      value={t.showDashboard}       onChange={v => setTweak("showDashboard", v)}/>
          <TweakToggle label="02 · Import — vide"           value={t.showImportEmpty}     onChange={v => setTweak("showImportEmpty", v)}/>
          <TweakToggle label="02 · Import — aperçu"         value={t.showImportPreview}   onChange={v => setTweak("showImportPreview", v)}/>
          <TweakToggle label="02 · Import — succès"         value={t.showImportSuccess}   onChange={v => setTweak("showImportSuccess", v)}/>
          <TweakToggle label="02 · Import — erreur"         value={t.showImportError}     onChange={v => setTweak("showImportError", v)}/>
          <TweakToggle label="03 · Tx — liste"              value={t.showTxList}          onChange={v => setTweak("showTxList", v)}/>
          <TweakToggle label="03 · Tx — détail"             value={t.showTxDetail}        onChange={v => setTweak("showTxDetail", v)}/>
          <TweakToggle label="03 · Tx — sélection"          value={t.showTxBulk}          onChange={v => setTweak("showTxBulk", v)}/>
          <TweakToggle label="03 · Tx — vide"               value={t.showTxEmpty}         onChange={v => setTweak("showTxEmpty", v)}/>
          <TweakToggle label="04 · Catégorie — rempli"      value={t.showCategoryDetail}  onChange={v => setTweak("showCategoryDetail", v)}/>
          <TweakToggle label="04 · Catégorie — vide"        value={t.showCategoryEmpty}   onChange={v => setTweak("showCategoryEmpty", v)}/>
          <TweakToggle label="05 · Évolution"               value={t.showEvolution}       onChange={v => setTweak("showEvolution", v)}/>
          <TweakToggle label="06 · Catégories — gestion"    value={t.showCategoriesManage} onChange={v => setTweak("showCategoriesManage", v)}/>
          <TweakToggle label="08 · Historique alertes"      value={t.showAlertsHistory}   onChange={v => setTweak("showAlertsHistory", v)}/>
        </TweakSection>

        <TweakSection title="Paramètres · sous-écrans">
          <TweakToggle label="Alertes"              value={t.showSettingsAlerts}     onChange={v => setTweak("showSettingsAlerts", v)}/>
          <TweakToggle label="Général"              value={t.showSettingsGeneral}    onChange={v => setTweak("showSettingsGeneral", v)}/>
          <TweakToggle label="Comptes & banques"    value={t.showSettingsAccounts}   onChange={v => setTweak("showSettingsAccounts", v)}/>
          <TweakToggle label="Sauvegarde & données" value={t.showSettingsBackup}     onChange={v => setTweak("showSettingsBackup", v)}/>
          <TweakToggle label="Apparence"            value={t.showSettingsAppearance} onChange={v => setTweak("showSettingsAppearance", v)}/>
          <TweakToggle label="À propos"             value={t.showSettingsAbout}      onChange={v => setTweak("showSettingsAbout", v)}/>
        </TweakSection>

        <TweakSection title="Overlays">
          <TweakToggle label="Modal Définir un budget" value={t.showBudgetModal}    onChange={v => setTweak("showBudgetModal", v)}/>
          <TweakToggle label="Palette ⌘K"              value={t.showCommandPalette} onChange={v => setTweak("showCommandPalette", v)}/>
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

function mix(a, b, t) {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255, ag = (pa >> 8) & 255, ab = pa & 255;
  const br = (pb >> 16) & 255, bg = (pb >> 8) & 255, bb = pb & 255;
  const r = Math.round(ar + (br - ar) * t);
  const g = Math.round(ag + (bg - ag) * t);
  const bl = Math.round(ab + (bb - ab) * t);
  return "#" + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, "0");
}

const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App/>);
