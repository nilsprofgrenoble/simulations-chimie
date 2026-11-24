// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS « VAL » : les exercices de l'atelier 77 rangés par TYPE d'exercice, puis par niveau, chapitre et difficulté.
//  Parcours de l'élève : VAL → un type (vraisemblance, compatibilité, décision) → son niveau, puis son chapitre → la liste → l'exercice.
//  Les types portent les mots du référentiel (« tests de vraisemblance », « comparer à une valeur de référence », « confronter un modèle »).
//  Aucun exercice n'est modifié ici : on ne fait que les ranger. Pur (sans React) : testé par validerParcours.test.mjs.
// ═══════════════════════════════════════════════════════════════════════════
import { rattachement } from '../parcoursCommun.js';

// Difficulté d'un exercice « plausible » : voir NIVEAUX dans AtelierValiderBanque.js (étoiles dans les listes)
export const DIFFICULTES_VAL = { 1: 'Repère direct', 2: 'Estimer', 3: 'Nuancer' };

// Les ids des types sont ceux des familles d'exercices de la banque (plausible, compat, decision) : les anciens liens ?ex=plausible.… restent valables.
export const TYPES_VAL = [
  { id: 'plausible', nom: 'Ce résultat est-il vraisemblable ?', but: 'Repérer un résultat aberrant (unité, puissance de 10…) en le comparant à des repères donnés.', filtre: 'niveau', difficulte: DIFFICULTES_VAL },
  { id: 'compat', nom: 'Une mesure est-elle compatible avec la référence ?', but: 'Comparer l’écart à l’incertitude pour décider si la mesure est compatible.', filtre: 'niveau' },
  { id: 'decision', nom: 'Décider et argumenter', but: 'Choisir entre deux modèles ou juger la conformité à un cahier des charges, en justifiant.' },
];

// Une entrée par exercice : l'identifiant est « famille.exercice » (même forme que l'adresse ?ex=…)
export function construireItemsVal(familles) {
  return familles.flatMap(f => f.liste.map(x => {
    const { niveaux, chapitres } = rattachement(x.domaine);
    return { id: `${f.id}.${x.id}`, cle: `77:${f.id}:${x.id}`, type: f.id, fam: f.id, brut: x.id, titre: x.titre, detail: x.niveau ? `${'★'.repeat(x.niveau)} ${DIFFICULTES_VAL[x.niveau] || ''}`.trim() : '', dif: x.niveau, niveaux, chapitres };
  }));
}
