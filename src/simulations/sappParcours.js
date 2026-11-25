// ═══════════════════════════════════════════════════════════════════════════
//  PARCOURS « S'APP » : les exercices des ateliers 34 (énoncés, situations) et 35 (graphiques) rangés par TYPE d'exercice,
//  puis par niveau, enseignement et chapitre. Une seule porte d'entrée pour les deux ateliers.
//  Types (mots du référentiel : « rechercher et organiser l'information », « représenter la situation ») :
//    données : repérer les données utiles d'un énoncé · situation : comprendre une situation pas à pas · graphique : lire un graphique.
//  Aucun exercice n'est modifié ici : on ne fait que les ranger. Pur (sans React) : testé par sappParcours.test.mjs.
// ═══════════════════════════════════════════════════════════════════════════
import { rattachement } from '../parcoursCommun.js';

export const TYPES_SAPP = [
  { id: 'donnees', nom: 'Repérer les données utiles d’un énoncé', but: 'La formule est donnée : comprendre la question, trier les données, les associer aux grandeurs de la formule et choisir la bonne unité.', filtre: 'niveau' },
  { id: 'situation', nom: 'Comprendre une situation pas à pas', but: 'Comprendre ce que fait un système, repérer l’événement important et choisir la bonne instruction ou la bonne explication.', filtre: 'niveau' },
  { id: 'graphique', nom: 'Lire un graphique', but: 'Identifier grandeurs, unités et échelles, lire des valeurs, interpréter l’allure d’une courbe.' },
];

// Titre court d'un graphique (la fonction titre dépend des valeurs tirées au hasard)
export const titreGraphique = s => {
  try { return String(s.titre(s.gen ? s.gen() : {})).replace(/\s*\(.*\)\s*$/, ''); } catch { return s.id; }
};

// Identifiants (même forme que l'adresse ?ex=…) : énoncé « id.numéro de question » · situation « id » · graphique « id ».
// La clé de progression est celle du suivi de chaque atelier (34:… et 35:…).
export function construireItemsSapp({ enonces, situations, scenarios }) {
  const it = (o, rat) => ({ ...o, ...rattachement(rat, o.cle) });
  return [
    ...enonces.flatMap(e => e.noms.map((nom, q) => it({ id: `${e.id}.${q}`, cle: `34:${e.id}.${q}`, type: 'donnees', atelier: 34, brut: e.id, q, titre: e.titre, detail: nom }, e.domaine))),
    ...situations.map(s => it({ id: s.id, cle: `34:${s.id}`, type: 'situation', atelier: 34, brut: s.id, titre: s.titre, detail: '' }, s.domaine)),
    ...scenarios.map(s => it({ id: s.id, cle: `35:${s.id}`, type: 'graphique', atelier: 35, brut: s.id, titre: titreGraphique(s), detail: s.domaine || '' }, s.domaine)),
  ];
}
