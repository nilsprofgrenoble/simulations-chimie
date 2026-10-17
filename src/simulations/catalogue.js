import { tousLesExercices } from "./Entrainement";
import { etiquettesDefis, nomsSim } from "../suivi";
import { simsDe, CHAPITRES } from "../chapitres";

// Tous les exercices (S'APP, ANA, REA) et tous les défis de simulations, avec leur clé de progression.
// Un exercice : { cle, comp, titre, atelier, ex } ; un défi : { cle, comp: 'DÉFI', titre, sim }.
export const catalogue = () => [...tousLesExercices(), ...etiquettesDefis().map(d => ({ cle: d.cle, comp: 'DÉFI', titre: d.titre, sim: d.sim }))];

// Éléments d'un DEVOIR : le catalogue précédent + les simulations des chapitres (clé « sim:<id> », voir src/devoirs.js)
export const catalogueDevoirs = () => [
  ...catalogue(),
  ...simsDe(CHAPITRES).map(id => ({ cle: `sim:${id}`, comp: 'SIM', titre: nomsSim[id] || `Simulation ${id}`, sim: id })),
];
