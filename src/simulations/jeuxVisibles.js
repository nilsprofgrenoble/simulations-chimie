// Interrupteur général des jeux (escape games Kepler et Aqua, histoires à choix Labo et Percutaféine).
// false : seul le professeur administrateur voit les jeux (menu, cartes, liens directs) ; les autres professeurs et les élèves ne voient rien.
// true : les jeux sont ouverts à tous (avec leur code pour les élèves).
export const JEUX_VISIBLES = false;
// Jeux ouverts à tous même quand JEUX_VISIBLES est false : ils apparaissent dans le menu « Jeux » et sur la page « Je m'entraîne », en accès direct (sans code) ; les autres jeux restent masqués.
// 113 : Contre-typer la Percutaféine (code PERCU). 290 : Laser Maze. 291 : Urgence au labo : dilutions. (290 et 291 sont aussi proposés dans les chapitres concernés.)
export const JEUX_PUBLICS = [113, 290, 291];

// Un jeu est-il visible pour ce visiteur ? (interrupteur général, administrateur, ou jeu ouvert à tous). Même règle que le menu « Jeux » et les liens directs.
export const jeuOuvert = (id, admin) => JEUX_VISIBLES || !!admin || JEUX_PUBLICS.includes(id);
