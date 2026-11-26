// Jeux et outils EN PRÉPARATION : réservés au professeur administrateur. Les autres enseignants et les élèves ne les voient nulle part
// (menu, cartes, liens directs, pages statiques, plan du site, catalogue téléchargeable).
//
//   • Pour masquer un nouveau jeu ou un nouvel outil : ajouter son numéro dans la bonne liste ci-dessous.
//   • Pour le publier quand il est prêt : l'en retirer (puis, pour le catalogue : node scripts/catalogue.mjs).
//
// Module pur (aucune dépendance au navigateur) : lu par l'application, par vite.config.js (pages statiques, plan du site),
// par scripts/catalogue.mjs et par le test src/brouillons.test.mjs.

// Jeux (escape games, histoires à choix, jeux d'arcade) : 79 Kepler, 80 Aqua, 81 Une journée au labo, (290 Laser Maze et 291 Urgence au labo : dilutions ont été publiés le 26/11/2026.)
// Leur interrupteur général est dans src/simulations/jeuxVisibles.js (le jeu 113, Percutaféine, y est ouvert à tous exprès).
export const JEUX_BROUILLON = [79, 80, 81];

// Outils (menu « Outils », visible du seul administrateur) : 124 Grapheur de mesures.
export const OUTILS_BROUILLON = [124];

export const SIMS_BROUILLON = [...JEUX_BROUILLON, ...OUTILS_BROUILLON];
