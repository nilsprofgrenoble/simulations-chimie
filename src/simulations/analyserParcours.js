// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS « ANA » : les exercices de l'atelier 37 rangés par TYPE d'exercice, puis (pour les gros types) par niveau et chapitre.
//  Parcours de l'élève : ANA → un type (démarche, relation, hypothèses, prévision, schéma, algorithme) → son niveau, enseignement et chapitre → la liste → l'exercice.
//  Les types portent les mots du référentiel (« proposer une stratégie de résolution », « choisir un modèle ou des lois pertinentes »,
//  « formuler des hypothèses », « faire des prévisions à l'aide d'un modèle »). Aucun exercice n'est modifié ici : on ne fait que les ranger.
//  Pur (sans React) : testé par analyserParcours.test.mjs.
// ═══════════════════════════════════════════════════════════════════════════
import { rattachement } from '../parcoursCommun.js';

// Les ids des types sont ceux des familles de la banque, sauf « schema » qui réunit « champ » et « mouvement » (les deux lisent un schéma pour en déduire le modèle).
export const TYPES_ANA = [
  { id: 'probleme', nom: 'Construire une démarche de résolution', but: 'Un problème complet : que cherche-t-on, quelles données, quelles relations, quelles hypothèses, dans quel ordre ?' },
  { id: 'relation', nom: 'Choisir la bonne relation', but: 'Plusieurs relations se ressemblent : laquelle s’applique vraiment à la situation ?', filtre: 'niveau' },
  { id: 'hypothese', nom: 'Formuler les hypothèses d’un modèle', but: 'Cocher toutes les hypothèses nécessaires pour appliquer un modèle, et seulement elles.', filtre: 'niveau' },
  { id: 'prevoir', nom: 'Prévoir sans calculer', but: 'Raisonner sur la relation (proportionnalité, carré, racine) pour prévoir l’effet d’un changement, sans faire le calcul.', filtre: 'niveau' },
  { id: 'schema', nom: 'Reconnaître la situation sur un schéma', but: 'Lire des lignes de champ, des vecteurs ou des trajectoires, et en déduire le modèle qui convient.' },
  { id: 'algorithme', nom: 'Compléter un algorithme', but: 'Un système automatique compare une mesure à des seuils : compléter les tests et prévoir ce que fait le programme.' },
];

const TYPE_PAR_FAMILLE = { champ: 'schema', mouvement: 'schema' };
export const typeDeFamille = fam => TYPE_PAR_FAMILLE[fam] || fam;

// Une entrée par exercice : l'identifiant est « famille.exercice » (même forme que l'adresse ?ex=…).
// Les types sans filtre (liste courte) affichent le thème sous le titre ; les gros types sont déjà rangés par chapitre.
export function construireItemsAna(familles) {
  return familles.flatMap(f => f.liste.map(x => {
    const { niveaux, chapitres } = rattachement(x.domaine);
    const type = typeDeFamille(f.id), filtre = TYPES_ANA.find(t => t.id === type)?.filtre;
    return { id: `${f.id}.${x.id}`, cle: `37:${f.id}:${x.id}`, type, fam: f.id, brut: x.id, titre: x.titre, detail: filtre ? '' : (x.domaine || ''), niveaux, chapitres };
  }));
}
