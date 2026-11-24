// QCM du parcours guidé de la simulation 144 (stéréoisomères, TSTL). `bonne` = indice de la bonne option (le cadre les mélange à l'affichage).
// Les descripteurs sont calculés par le modèle (jamais écrits à la main). Fichier à part pour contrôler par script que la bonne réponse n'est jamais la plus longue.
import * as M from './stereoisomeresModele.js';

export const MOL = M.CHLOROHYDROXY;
const ST = M.stereoisomeres(MOL);
export const A = ST[0];                                                  // la molécule de départ
export const IMG = ST.find(s => M.relation(A.desc, s.desc) === 'enantiomeres');
export const AUTRE = ST.find(s => M.relation(A.desc, s.desc) === 'diastereoisomeres' && s.desc[0] === A.desc[0]);       // seul C3 inversé
export const AUTRE2 = ST.find(s => M.relation(A.desc, s.desc) === 'diastereoisomeres' && s.desc[0] !== A.desc[0]);      // seul C2 inversé
export const nom = s => M.nomDesc(MOL, s.desc);
export const MESO = M.DIBROMOBUTANE, MESO_RS = M.stereoisomeres(MESO).find(s => s.id === 'RS');
const [nA, nI, nT, nT2] = [nom(A), nom(IMG), nom(AUTRE), nom(AUTRE2)];

export const QCM = {
  miroir: {
    options: [`${nI} : les deux carbones sont inversés`, `${nT} : seul le carbone C3 change de configuration, le carbone C2 reste le même`, `${nT2} : seul le carbone C2 change de configuration, le carbone C3 reste le même`, `${nA} : un miroir ne change rien à la configuration des carbones`],
    bonne: 0 },
  enantio: {
    options: [`énantiomères : image l’une de l’autre dans un miroir`, `diastéréoisomères : mêmes groupes, mais pas des images l’une de l’autre`, `identiques : une même molécule dessinée de deux façons`, `isomères de constitution : l’enchaînement des atomes n’est pas le même`],
    bonne: 0 },
  diast: {
    options: [`diastéréoisomères : stéréoisomères qui ne sont pas image l’un de l’autre`, `énantiomères : ils diffèrent par la configuration d’un carbone, c’est un miroir`, `identiques : les deux molécules se superposent après rotation`, `énantiomères : ils ont la même formule semi-développée, donc ils sont image l’un de l’autre`],
    bonne: 0 },
  alcene: {
    options: ['A : CH₃–CH=CH₂ : un carbone de C=C porte deux atomes d’hydrogène, il suffit que l’autre soit substitué',
      'B : CH₃–CH=CH–CH₂CH₃ : chaque carbone de C=C porte deux groupes différents',
      'C : (CH₃)₂C=CH–CH₃ : un carbone de C=C porte deux groupes méthyle identiques, ce qui suffit',
      'D : Cl₂C=CH₂ : la double liaison est très polarisée, donc il y a toujours deux arrangements'],
    bonne: 1 },
  prio: {
    options: ['Cl sur un carbone, COOH sur l’autre (jamais H)', 'H sur les deux carbones : les petits atomes passent toujours avant', 'Cl et COOH sur le même carbone, comme sur un seul carbone de C=C', 'Cl sur un carbone, H sur l’autre, car H n’a pas de numéro atomique'],
    bonne: 0 },
  ze: {
    options: ['Z : Cl et COOH (prioritaires) sont du même côté de C=C', 'E : Cl et COOH (prioritaires) sont de part et d’autre de C=C, un de chaque côté', 'Z : les deux atomes H sont l’un en haut, l’autre en bas de C=C', 'E : un seul des deux groupes prioritaires est dessiné au-dessus de la double liaison'],
    bonne: 0 },
  ze2: {
    options: ['E : Br et Cl (prioritaires) sont de côtés opposés de C=C', 'Z : Br et Cl (prioritaires) sont du même côté, et l’un des deux H est en bas', 'Z : Br est plus lourd que Cl, donc la configuration est toujours Z', 'E : les deux atomes d’hydrogène sont du même côté de C=C, quel que soit le dessin'],
    bonne: 0 },
  relZE: {
    options: ['diastéréoisomères : stéréoisomères non images l’un de l’autre', 'énantiomères : l’un est l’image de l’autre dans un miroir, comme pour un carbone asymétrique', 'identiques : on passe de l’un à l’autre en tournant la molécule autour de C=C', 'isomères de constitution : les atomes ne sont pas liés dans le même ordre'],
    bonne: 0 },
  proprietes: {
    options: ['seul le signe du pouvoir rotatoire (+21° et −21°)', 'la température de fusion, 112 °C pour l’un et une autre valeur pour l’autre', 'la densité et la solubilité dans l’eau, toutes deux différentes pour l’un et pour l’autre', 'toutes les propriétés physiques et chimiques, comme pour des diastéréoisomères'],
    bonne: 0 },
  meso: {
    options: ['identiques : la molécule a un plan de symétrie, c’est un composé méso', 'énantiomères : l’une est l’image de l’autre dans un miroir, elles ne se superposent pas', 'diastéréoisomères : un seul des deux carbones asymétriques est inversé', 'isomères de constitution : les atomes ne sont pas liés dans le même ordre'],
    bonne: 0 },
  eutomere: {
    options: ['eutomère (R)-M, distomère (S)-M', 'eutomère (S)-M, distomère (R)-M, car le S est toujours le moins actif', 'eutomère (R)-M et (S)-M à la fois, car ils ont la même formule', 'ni eutomère ni distomère : ces mots ne servent que pour des diastéréoisomères'],
    bonne: 0 },
  synthese: {
    options: ['une synthèse asymétrique, avec un catalyseur chiral qui favorise un seul énantiomère', 'chauffer le mélange racémique jusqu’à ce que l’énantiomère inutile (S)-M disparaisse', 'distiller le mélange : les deux énantiomères ont des températures d’ébullition différentes', 'ajouter un réactif achiral qui reconnaît (R)-M et laisse (S)-M de côté, pour le séparer'],
    bonne: 0 },
};
