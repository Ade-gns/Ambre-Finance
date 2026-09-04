// Fermeture d'un élément superposé (modal, panneau) à la touche Échap —
// convention UX attendue partout où un overlay se ferme déjà au clic
// extérieur.

import { useEffect, useRef } from "react";

/**
 * Appelle `onEscape` quand l'utilisateur appuie sur Échap, tant que `active`
 * est vrai. L'écouteur n'est posé que pendant l'ouverture, pour qu'un modal
 * fermé n'intercepte jamais la touche.
 *
 * Fermer n'est que fermer : le callback ne doit rien soumettre ni effacer une
 * saisie en cours ailleurs dans l'app — c'est le même geste qu'un clic sur le
 * fond de l'overlay.
 *
 * @param {boolean} active   modal ouvert ?
 * @param {() => void} onEscape  fermeture (typiquement le même callback que le clic extérieur)
 */
export function useEscapeKey(active, onEscape) {
  // Le callback est gardé dans une ref : les appelants passent presque tous
  // une lambda inline, qui changerait d'identité à chaque rendu et ferait
  // re-poser l'écouteur pour rien.
  const handler = useRef(onEscape);
  useEffect(() => { handler.current = onEscape; });

  useEffect(() => {
    if (!active) return;
    const onKey = e => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      handler.current?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);
}
