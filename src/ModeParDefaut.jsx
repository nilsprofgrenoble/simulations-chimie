import { useLayoutEffect } from "react";
import { getSession, estProf } from "./serveur";

// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS GUIDÉ PAR DÉFAUT : en arrivant sur une simulation, on est dans le parcours guidé (et non l'exploration libre),
//  pour qu'un élève qui découvre sache par où commencer. Un professeur connecté arrive, lui, sur l'exploration (démonstration).
//
//  Comment : chaque simulation a son bouton « 🧭 Parcours guidé » ; on clique dessus une fois, juste après l'affichage
//  (useLayoutEffect : avant que l'écran ne soit dessiné, donc sans clignotement). Ainsi chaque simulation applique sa propre
//  initialisation du parcours guidé, comme si l'élève avait cliqué lui-même.
//  Adaptatif : si la simulation a décidé de s'ouvrir sur l'exploration (modeOuverture dans suivi.js : parcours déjà terminé par cet élève,
//  ou lien de devoir vers un défi), ce clic n'a pas lieu.
//  Pour désactiver : mettre PARCOURS_GUIDE_PAR_DEFAUT à false.
// ═══════════════════════════════════════════════════════════════════════════
export const PARCOURS_GUIDE_PAR_DEFAUT = true;

export function ModeParDefaut({ simId, cibleId }) {
  useLayoutEffect(() => {
    if (!PARCOURS_GUIDE_PAR_DEFAUT || estProf(getSession())) return;
    const ouverture = window.__modeOuverture; window.__modeOuverture = undefined;   // lu une seule fois, pour ne pas servir à la simulation suivante
    if (ouverture === 'explore' || ouverture === 'defi') return;   // parcours déjà terminé (ou lien de devoir vers un défi) : on reste sur l'exploration
    const zone = document.getElementById(cibleId);
    const bouton = zone && [...zone.querySelectorAll('button')].find(b => b.textContent.includes('Parcours guidé'));
    if (!bouton) return;
    window.__clicAuto = true;               // pour que ce clic ne soit pas compté comme un clic de visiteur (stats.js)
    try { bouton.click(); } finally { window.__clicAuto = false; }
  }, [simId, cibleId]);
  return null;
}
