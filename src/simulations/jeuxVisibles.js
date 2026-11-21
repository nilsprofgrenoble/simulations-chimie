// Interrupteur général des jeux (escape games Kepler et Aqua, histoires à choix Labo et Percutaféine).
// false : seul le professeur administrateur voit les jeux (menu, cartes, liens directs) ; les autres professeurs et les élèves ne voient rien.
// true : les jeux sont ouverts à tous (avec leur code pour les élèves).
export const JEUX_VISIBLES = false;
// Jeux ouverts à tous même quand JEUX_VISIBLES est false : ils apparaissent dans le menu « Jeux » et sur la page « Je m'entraîne », en accès direct (sans code) ; les autres jeux restent masqués.
// 113 : Contre-typer la Percutaféine (code PERCU).
export const JEUX_PUBLICS = [113];
