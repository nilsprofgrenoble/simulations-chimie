import { tousLesExercices } from "./Entrainement";
import { etiquettesDefis } from "../suivi";

// Tous les exercices (S'APP, ANA, REA) et tous les défis de simulations, avec leur clé de progression.
// Un exercice : { cle, comp, titre, atelier, ex } ; un défi : { cle, comp: 'DÉFI', titre, sim }.
export const catalogue = () => [...tousLesExercices(), ...etiquettesDefis().map(d => ({ cle: d.cle, comp: 'DÉFI', titre: d.titre, sim: d.sim }))];
