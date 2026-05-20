/* Écran Onboarding — Premier lancement de l'application
   Layout 2 colonnes plein écran :
   - GAUCHE : hero éditorial (manifesto, principes, mentions)
   - DROITE : zone d'import direct du premier relevé

   Particularité : pas de sidebar, l'app n'est pas encore initialisée. */

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTransactions } from "../lib/store";
import { IcLock, IcTag, IcChart, IcUpload } from "../lib/icons";

const SAMPLE_RAW = [
  // Février
  ["28/02/2026","Virement Dupont SAS","Salaire février","inc",2560,"Virement"],
  // Mars
  ["01/03/2026","Loyer résidence","Prélèvement mars","loy",-820,"Prélèvement"],
  ["02/03/2026","Carrefour City","Courses","alim",-38.50,"CB"],
  ["03/03/2026","Netflix","Abonnement mensuel","abo",-15.99,"Prélèvement"],
  ["03/03/2026","Spotify","Premium","abo",-10.99,"Prélèvement"],
  ["04/03/2026","RATP","Navigo mensuel","tra",-86.40,"CB"],
  ["05/03/2026","Boulangerie du Marché","Pain & viennoiseries","alim",-12.30,"CB"],
  ["06/03/2026","Pharmacie Centrale","Médicaments","san",-24.60,"CB"],
  ["07/03/2026","Le Bistrot","Déjeuner","alim",-16.50,"CB"],
  ["08/03/2026","Monoprix","Courses du week-end","alim",-72.40,"CB"],
  ["10/03/2026","Amazon Prime","Abonnement","abo",-6.99,"Prélèvement"],
  ["10/03/2026","Fnac.com","Livre","loi",-19.90,"CB"],
  ["11/03/2026","Darty","Petits électroménagers","aut",-49.00,"CB"],
  ["12/03/2026","Sushi Shop","Livraison","alim",-34.80,"CB"],
  ["13/03/2026","Gym Direct","Abonnement","abo",-19.90,"Prélèvement"],
  ["14/03/2026","EDF","Électricité","loy",-62.00,"Prélèvement"],
  ["14/03/2026","Le Petit Café","Café","alim",-4.20,"CB"],
  ["15/03/2026","Virement Dupont SAS","Salaire mars","inc",2560,"Virement"],
  ["16/03/2026","Lidl","Courses","alim",-44.70,"CB"],
  ["17/03/2026","SNCF","Paris-Lyon","tra",-43.00,"CB"],
  ["18/03/2026","Uber Eats","Livraison","alim",-28.50,"CB"],
  ["19/03/2026","Cinéma UGC","Séance","loi",-13.50,"CB"],
  ["19/03/2026","Bar Le Central","Soirée","loi",-22.00,"CB"],
  ["20/03/2026","Pharmacie Centrale","Ordo","san",-18.40,"CB"],
  ["21/03/2026","Auchan Drive","Courses","alim",-89.30,"CB"],
  ["22/03/2026","Free Mobile","Forfait","abo",-19.99,"Prélèvement"],
  ["23/03/2026","BoulPaul","Sandwich","alim",-9.50,"CB"],
  ["24/03/2026","Virement épargne","Livret A","epa",-300,"Virement"],
  ["25/03/2026","Kiabi","Vêtements","aut",-56.90,"CB"],
  ["26/03/2026","Carrefour Market","Courses","alim",-61.20,"CB"],
  ["27/03/2026","La Bonne Table","Dîner","loi",-58.00,"CB"],
  ["28/03/2026","TotalEnergies","Essence","tra",-65.00,"CB"],
  ["29/03/2026","iTunes","App","abo",-1.99,"CB"],
  ["30/03/2026","Monoprix","Courses","alim",-45.10,"CB"],
  ["31/03/2026","Boulangerie","Viennoiseries","alim",-8.70,"CB"],
  // Avril
  ["01/04/2026","Loyer résidence","Prélèvement avril","loy",-820,"Prélèvement"],
  ["01/04/2026","Netflix","Abonnement mensuel","abo",-15.99,"Prélèvement"],
  ["01/04/2026","Spotify","Premium","abo",-10.99,"Prélèvement"],
  ["02/04/2026","RATP","Navigo","tra",-86.40,"CB"],
  ["03/04/2026","Lidl","Courses","alim",-52.30,"CB"],
  ["04/04/2026","Le Bistrot","Déjeuner","alim",-14.80,"CB"],
  ["05/04/2026","Amazon Prime","Abonnement","abo",-6.99,"Prélèvement"],
  ["06/04/2026","Pharmacie","Médicaments","san",-32.50,"CB"],
  ["07/04/2026","Carrefour","Courses","alim",-78.60,"CB"],
  ["08/04/2026","EDF","Électricité","loy",-62.00,"Prélèvement"],
  ["09/04/2026","Gym Direct","Abonnement","abo",-19.90,"Prélèvement"],
  ["10/04/2026","Free Mobile","Forfait","abo",-19.99,"Prélèvement"],
  ["11/04/2026","Sushi Shop","Livraison","alim",-38.90,"CB"],
  ["12/04/2026","MK2 Cinéma","Film","loi",-11.00,"CB"],
  ["13/04/2026","Bar Le Central","Soirée","loi",-18.00,"CB"],
  ["14/04/2026","Boulangerie","Pain","alim",-7.40,"CB"],
  ["15/04/2026","Virement Dupont SAS","Salaire avril","inc",2560,"Virement"],
  ["16/04/2026","Auchan","Courses","alim",-94.20,"CB"],
  ["17/04/2026","SNCF","Paris-Bordeaux","tra",-62.00,"CB"],
  ["18/04/2026","Le Petit Café","Café","alim",-5.10,"CB"],
  ["19/04/2026","Decathlon","Sport","loi",-89.00,"CB"],
  ["20/04/2026","Carrefour Market","Courses","alim",-55.80,"CB"],
  ["21/04/2026","Uber Eats","Livraison","alim",-32.40,"CB"],
  ["22/04/2026","Virement épargne","Livret A","epa",-300,"Virement"],
  ["23/04/2026","Monoprix","Courses","alim",-42.90,"CB"],
  ["24/04/2026","iTunes","App","abo",-1.99,"CB"],
  ["25/04/2026","Restaurant Chez Paul","Dîner","loi",-72.00,"CB"],
  ["26/04/2026","TotalEnergies","Essence","tra",-58.00,"CB"],
  ["27/04/2026","Auchan Drive","Courses","alim",-82.40,"CB"],
  ["28/04/2026","Darty","Ampoules","aut",-22.00,"CB"],
  ["29/04/2026","Boulangerie","Pâtisseries","alim",-11.20,"CB"],
  ["30/04/2026","Pharmacie","Vitamines","san",-21.00,"CB"],
  // Mai
  ["01/05/2026","Loyer résidence","Prélèvement mai","loy",-820,"Prélèvement"],
  ["01/05/2026","Netflix","Abonnement mensuel","abo",-15.99,"Prélèvement"],
  ["01/05/2026","Spotify","Premium","abo",-10.99,"Prélèvement"],
  ["02/05/2026","RATP","Navigo","tra",-86.40,"CB"],
  ["03/05/2026","Carrefour City","Courses","alim",-36.80,"CB"],
  ["04/05/2026","Amazon Prime","Abonnement","abo",-6.99,"Prélèvement"],
  ["05/05/2026","Gym Direct","Abonnement","abo",-19.90,"Prélèvement"],
  ["06/05/2026","Free Mobile","Forfait","abo",-19.99,"Prélèvement"],
  ["06/05/2026","Auchan Drive","Courses","alim",-82.40,"CB"],
  ["07/05/2026","Monoprix","Courses","alim",-39.85,"CB"],
  ["07/05/2026","Le Bistrot","Déjeuner","alim",-13.70,"CB"],
  ["08/05/2026","EDF","Électricité","loy",-62.00,"Prélèvement"],
  ["09/05/2026","Fnac.com","Livre tech","loi",-34.90,"CB"],
  ["09/05/2026","Pharmacie de l'Hôtel","Médicaments","san",-22.50,"CB"],
  ["10/05/2026","MK2 Cinéma","Film","loi",-11.00,"CB"],
  ["10/05/2026","Bar Le Central","Soirée","loi",-22.00,"CB"],
  ["11/05/2026","Fnac.com","Casque Bluetooth","loi",-229.90,"CB"],
  ["12/05/2026","Carrefour Market","Courses","alim",-52.34,"CB"],
  ["13/05/2026","Virement Dupont SAS","Salaire mai","inc",2560,"Virement"],
  ["14/05/2026","Le Petit Café","Café","alim",-14.20,"CB"],
  ["15/05/2026","Lidl","Courses","alim",-47.60,"CB"],
  ["16/05/2026","Virement épargne","Livret A","epa",-300,"Virement"],
  ["17/05/2026","Uber Eats","Livraison","alim",-29.80,"CB"],
  ["18/05/2026","Boulangerie","Pain","alim",-8.90,"CB"],
  ["19/05/2026","TotalEnergies","Essence","tra",-61.00,"CB"],
];
const DAYS_SHORT = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const SAMPLE_TRANSACTIONS = SAMPLE_RAW.map(([d, lbl, sub, cat, amt, mode], i) => {
  const [dd, mm, yyyy] = d.split("/").map(Number);
  const dow = DAYS_SHORT[new Date(yyyy, mm - 1, dd).getDay()];
  return { id: i + 1, d, lbl, sub, cat, amt, acc: "BNP Principal", mode, dow, conf: 100 };
});

export default function Onboarding() {
  const navigate = useNavigate();
  const [, setTransactions] = useTransactions();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  function handleFiles(files) {
    if (!files || files.length === 0) return;
    navigate("/import");
  }

  function loadSample() {
    localStorage.setItem("ambre.sampleMode", "1");
    setTransactions(SAMPLE_TRANSACTIONS);
    navigate("/");
  }

  return (
    <div className="ob-root">
      <style>{OB_STYLES}</style>

      {/* GAUCHE — manifesto */}
      <div className="ob-left">
        <div className="ob-logo">
          <div className="ob-logo-mark">a</div>
          <div>
            <div className="ob-logo-n">Ambre</div>
            <div className="ob-logo-s">Finance personnelle · v0.4.2</div>
          </div>
        </div>

        <div>
          <h1 className="ob-h1">Vos finances,<br/>au calme. <em>Ici.</em></h1>
          <p className="ob-sub">
            Ambre lit vos relevés bancaires localement, en extrait les transactions et
            les classe en quelques secondes. <strong>Aucun cloud, aucun compte, aucune connexion.</strong>
            Vos données ne quittent jamais votre appareil.
          </p>
        </div>

        <div className="ob-principles">
          <div className="ob-prn">
            <div className="ob-prn-ico"><IcLock size={18}/></div>
            <div>
              <div className="ob-prn-t">Local par défaut.</div>
              <div className="ob-prn-d">
                Tout est stocké dans une base SQLite sur votre disque.
                Vous pouvez l'ouvrir, la sauvegarder, l'effacer quand vous voulez.
              </div>
            </div>
          </div>
          <div className="ob-prn">
            <div className="ob-prn-ico"><IcTag size={18}/></div>
            <div>
              <div className="ob-prn-t">Classement intelligent, modifiable.</div>
              <div className="ob-prn-d">
                Les transactions sont pré-rangées par catégorie. Les règles que vous créez
                s'appliquent automatiquement aux futurs relevés.
              </div>
            </div>
          </div>
          <div className="ob-prn">
            <div className="ob-prn-ico"><IcChart size={18}/></div>
            <div>
              <div className="ob-prn-t">Lecture immédiate.</div>
              <div className="ob-prn-d">
                Combien j'ai dépensé, dans quoi, comment ça évolue — sans clic supplémentaire.
              </div>
            </div>
          </div>
        </div>

        <div className="ob-meta">
          <span className="dot">●</span>
          Open source · MIT · vos données restent ici · aucune télémétrie
        </div>
      </div>

      {/* DROITE — import setup */}
      <div className="ob-right">
        <div className="ob-step">
          <span>Étape 1 sur 4</span>
          <div className="dots">
            <span className="active"/>
            <span/><span/><span/>
          </div>
        </div>

        <div>
          <h2 className="ob-r-h">Importez votre premier <em>relevé</em>.</h2>
          <p className="ob-r-s" style={{ marginTop: 10 }}>
            Glissez un PDF de votre banque ou un export CSV. Ambre détectera le format
            et vous montrera un aperçu avant d'enregistrer quoi que ce soit.
          </p>
        </div>

        <div
          className={"ob-drop" + (dragOver ? " drag-over" : "")}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        >
          <div className="ob-drop-ico">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 4h6l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/>
              <path d="M15 4v5h5"/>
              <path d="M12 19v-8M8 15l4-4 4 4"/>
            </svg>
          </div>
          <div className="ob-drop-t">Glissez un relevé ici</div>
          <div className="ob-drop-s">
            PDF, CSV, OFX ou QIF — la plupart des banques françaises sont reconnues.
          </div>
          <input ref={fileRef} type="file" accept=".pdf,.csv,.ofx,.qif"
                 style={{ display: "none" }}
                 onChange={e => handleFiles(e.target.files)}/>
          <button className="ob-drop-btn" onClick={() => fileRef.current?.click()}>
            <IcUpload size={14}/>Parcourir mes fichiers
          </button>
          <div className="ob-drop-fmt">
            <span>.pdf</span><span>.csv</span><span>.ofx</span><span>.qif</span>
          </div>
        </div>

        <div className="ob-alt">
          <div className="ob-alt-ico"><IcTag size={15}/></div>
          <div style={{ flex: 1 }}>
            <div className="ob-alt-t">Pas de relevé sous la main ?</div>
            <div className="ob-alt-s">
              Démarrez avec un jeu de données d'exemple — 3 mois fictifs, 95 transactions.
            </div>
          </div>
          <span className="ob-alt-cta" onClick={loadSample}>Charger l'exemple →</span>
        </div>

        <div className="ob-foot">
          <a style={{ cursor: "pointer" }} onClick={() => navigate("/")}>← Configurer plus tard</a>
          <span>↩ Entrée pour continuer</span>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Styles
   ───────────────────────────────────────────────────────────────── */
const OB_STYLES = `
  .ob-root { width: 100%; height: 100vh;
             background: var(--cream-100); color: var(--ink-800);
             display: grid; grid-template-columns: 1.05fr 0.95fr;
             overflow: hidden; font-size: 13px; }

  /* LEFT — manifesto */
  .ob-left { padding: 56px 64px; background: var(--cream-50);
             display: flex; flex-direction: column; justify-content: space-between;
             position: relative; overflow: auto; }
  .ob-left::before { content: ""; position: absolute; inset: 0; opacity: 0.5;
                     background-image: radial-gradient(circle at 80% 20%, rgba(184,105,61,0.10), transparent 60%); }
  .ob-left > * { position: relative; z-index: 1; }

  .ob-logo { display: flex; align-items: center; gap: 12px; }
  .ob-logo-mark { width: 44px; height: 44px; border-radius: 12px;
                  background: linear-gradient(140deg, #cd8459, #b8693d);
                  color: var(--cream-50);
                  display: flex; align-items: center; justify-content: center;
                  font-family: var(--font-display); font-style: italic; font-size: 26px; }
  .ob-logo-n { font-family: var(--font-display); font-size: 22px;
               color: var(--ink-900); letter-spacing: -0.01em; }
  .ob-logo-s { font-size: 11px; color: var(--ink-500);
               letter-spacing: 0.08em; text-transform: uppercase; margin-top: 2px; }

  .ob-h1 { font-family: var(--font-display); font-size: 64px; line-height: 1.05;
           color: var(--ink-900); letter-spacing: -0.02em;
           margin: 0; font-weight: 400; max-width: 600px; }
  .ob-h1 em { font-style: italic; color: var(--amber-500); }
  .ob-sub { font-size: 16px; color: var(--ink-600); margin-top: 20px;
            max-width: 500px; line-height: 1.6; }
  .ob-sub strong { color: var(--ink-800); font-weight: 500; }

  .ob-principles { display: flex; flex-direction: column; gap: 18px; max-width: 540px; }
  .ob-prn { display: flex; gap: 14px; align-items: flex-start; }
  .ob-prn-ico { width: 36px; height: 36px; border-radius: 10px;
                background: var(--amber-100); color: var(--amber-500);
                display: flex; align-items: center; justify-content: center;
                flex-shrink: 0; }
  .ob-prn-t { font-size: 14px; color: var(--ink-900); font-weight: 500; }
  .ob-prn-d { font-size: 12.5px; color: var(--ink-600); margin-top: 3px; line-height: 1.5; }

  .ob-meta { display: flex; align-items: center; gap: 10px;
             font-size: 11px; color: var(--ink-500); }
  .ob-meta .dot { color: var(--sage-500); }

  /* RIGHT — import setup */
  .ob-right { padding: 56px; background: var(--cream-100);
              display: flex; flex-direction: column; gap: 22px;
              justify-content: center; overflow: auto; }

  .ob-step { display: flex; align-items: center; gap: 12px;
             font-size: 11px; color: var(--ink-500);
             letter-spacing: 0.1em; text-transform: uppercase; }
  .ob-step .dots { display: flex; gap: 5px; }
  .ob-step .dots > span { width: 6px; height: 6px; border-radius: 999px;
                          background: var(--cream-300); }
  .ob-step .dots > span.active { background: var(--amber-500);
                                  width: 18px; border-radius: 4px; }

  .ob-r-h { font-family: var(--font-display); font-size: 30px;
            color: var(--ink-900); letter-spacing: -0.01em;
            margin: 0; font-weight: 400; }
  .ob-r-h em { font-style: italic; color: var(--amber-500); }
  .ob-r-s { font-size: 13px; color: var(--ink-600); line-height: 1.5; }

  .ob-drop { background: var(--cream-50);
             border: 1.5px dashed rgba(184,105,61,0.5);
             border-radius: 16px; padding: 36px 28px;
             display: flex; flex-direction: column;
             align-items: center; gap: 12px; }
  .ob-drop.drag-over { border-color: var(--amber-500); background: rgba(184,105,61,0.05); }
  .ob-drop-ico { width: 56px; height: 56px; border-radius: 14px;
                 background: var(--amber-100); color: var(--amber-500);
                 display: flex; align-items: center; justify-content: center; }
  .ob-drop-t { font-family: var(--font-display); font-size: 22px; color: var(--ink-900); }
  .ob-drop-s { font-size: 12px; color: var(--ink-600);
               text-align: center; max-width: 360px; }
  .ob-drop-btn { display: inline-flex; align-items: center; gap: 8px;
                 padding: 11px 18px;
                 background: var(--amber-500); color: var(--cream-50);
                 border: none; border-radius: 9px;
                 font-size: 13px; font-weight: 500; margin-top: 4px;
                 cursor: pointer; }
  .ob-drop-fmt { display: flex; gap: 6px; }
  .ob-drop-fmt > span { font-family: var(--font-mono); font-size: 10px;
                        padding: 2px 8px;
                        background: var(--cream-200); color: var(--ink-700);
                        border-radius: 999px; }

  .ob-alt { display: flex; align-items: center; gap: 10px;
            padding: 14px 16px;
            background: var(--cream-50); border: 1px solid var(--line);
            border-radius: 10px; }
  .ob-alt-ico { width: 30px; height: 30px; border-radius: 8px;
                background: var(--cream-200); color: var(--ink-700);
                display: flex; align-items: center; justify-content: center;
                flex-shrink: 0; }
  .ob-alt-t { font-size: 13px; color: var(--ink-800); }
  .ob-alt-s { font-size: 11px; color: var(--ink-500); margin-top: 1px; }
  .ob-alt-cta { font-size: 12px; color: var(--amber-500);
                font-weight: 500; cursor: pointer; }

  .ob-foot { display: flex; align-items: center; justify-content: space-between;
             margin-top: 6px; font-size: 12px; color: var(--ink-500); }
  .ob-foot a { color: var(--ink-700); cursor: pointer; text-decoration: none; }

  /* Responsive : sur petit écran, on empile */
  @media (max-width: 1100px) {
    .ob-root { grid-template-columns: 1fr; grid-template-rows: auto 1fr; overflow: auto; }
    .ob-left { padding: 36px 40px; }
    .ob-h1 { font-size: 44px; }
    .ob-right { padding: 40px; }
  }
`;
