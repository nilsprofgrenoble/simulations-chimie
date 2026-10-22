import { CLE_PARTIE_KEPLER, ID_ESCAPE } from "./simulations/escapeKeplerConstantes";
import * as Kepler from "./simulations/escapeKeplerModele";
import * as Aqua from "./simulations/escapeAquaModele";

// Une mission = une épreuve d'un escape game (Kepler ou Aqua) ouverte dans une simulation existante.
// Ce module dit si la simulation affichée est ouverte dans le cadre d'une partie en cours (lu par App, CadreMission et BoutonsModes).
export const JEUX_MISSION = {
  kepler: { cle: CLE_PARTIE_KEPLER, page: ID_ESCAPE, M: Kepler, nom: 'Mission Kepler', retour: 'Retour à la station Kepler', icone: '🚀',
    fond: 'radial-gradient(ellipse at 50% 0%, #1b2a5c 0%, #070d24 55%, #03060f 100%)',
    c: { panneau: '#0a1530', bord: '#1c3a6b', texte: '#e6f0ff', doux: '#8fa6c9', accent: '#38e1ff', vert: '#3be29a', ambre: '#ffc15a' } },
  aqua: { cle: Aqua.CLE_PARTIE_AQUA, page: Aqua.ID_AQUA, M: Aqua, nom: 'Mission Aqua', retour: 'Retour à la station de pompage', icone: '💧',
    fond: 'linear-gradient(180deg, #0b3b5e 0%, #082a45 50%, #04182a 100%)',
    c: { panneau: '#0b2540', bord: '#1d4a7a', texte: '#e8f4ff', doux: '#93b4d3', accent: '#4fd8ff', vert: '#3be29a', ambre: '#ffc15a' } },
};
const lire = (stockage, cle, secours) => { try { return JSON.parse(stockage.getItem(cle) || 'null') ?? secours; } catch { return secours; } };

// null si la simulation n'est pas ouverte pour une mission de la partie en cours
export function missionEnCours(simId) {
  const retour = lire(window.sessionStorage, 'escape-retour', null);
  if (!retour || retour.sim !== simId) return null;
  const jeu = retour.jeu || 'kepler', def = JEUX_MISSION[jeu];
  const partie = lire(window.localStorage, def.cle, null);
  if (!partie || typeof partie.debut !== 'number' || partie.fin != null) return null;
  const m = [...def.M.MODULES, def.M.CONTROLE].find(x => x.id === retour.id);
  return m ? { jeu, def, m, partie, controle: m.id === def.M.CONTROLE.id } : null;
}
