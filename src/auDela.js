// Exercices qui vont AU-DELÀ du programme du niveau : conservés, signalés par une pastille (CodeExo) et rangés dans le bloc
// « Pour aller plus loin » de la page du chapitre (champ audela de chapitres.js), pour l'élève qui veut dépasser le programme.
import { CHAPITRES } from './chapitres';
import { cleDans } from './chapitre';

// Exercices au-delà du programme sans chapitre où les ranger (par exemple un exercice de calcul REA, proposé à tous les chapitres)
const SANS_CHAPITRE = ['36:tens-klevens'];
const TOUTES = [...CHAPITRES.flatMap(c => c.audela || []), ...SANS_CHAPITRE];
export const estAuDela = cle => cleDans(cle, TOUTES);
