// ====================================================
//  Exercice « calcul » de la simulation 188 (transferts de H⁺) : tirage pur, sans React, testable avec node
//  (brnExos.test.mjs relit le texte affiché, refait le calcul et le compare à la réponse attendue sur des milliers de tirages).
//  Quatre questions : nombre total d'électrons de valence n_T, nombre de doublets n_D, doublets non liants, charge d'une espèce dans une équation acide-base.
// ====================================================
import { TOUTES_ESPECES, REACTIONS_DEFI, nT, nDoublets, nDoubletsLiants, nDoubletsNonLiants, chargeTxt, texteTerme, VALENCE } from './brnModele.js';
const NB = ' ';
// « de l’eau », « de l’ion ammonium », « de la méthylamine » (élision et article)
const de = nom => (/^[aeiouyhéèêâîôû]/i.test(nom) ? 'de l’' : 'de la ') + nom;
const AVEC_LEWIS = TOUTES_ESPECES.filter(e => e.graphe);
const nbAtomes = e => Object.values(e.atomes).reduce((t, k) => t + k, 0);
const sommeValences = e => Object.entries(e.atomes).reduce((t, [el, k]) => t + k * VALENCE[el], 0);
const sommeDistincts = e => Object.keys(e.atomes).reduce((t, el) => t + VALENCE[el], 0);
const DONNEES = 'Électrons de valence des atomes seuls : H 1 ; C 4 ; N 5 ; O 6.';
const sgn = q => (q < 0 ? '−' + Math.abs(q) : q > 0 ? '+' + q : '0');
const decompose = e => Object.keys(e.atomes).sort().map(el => `${e.atomes[el]} × ${VALENCE[el]} (${el})`).join(' + ');

export function tirageCalcul(tire) {
  // 1. n_T
  const e1 = tire(AVEC_LEWIS), S1 = sommeValences(e1), n1 = nT(e1.graphe);
  const q1 = { id: 'br0', type: 'num', unite: 'électrons', vrai: n1, tolRel: 0, csMin: String(n1).length,
    q: `Combien d’électrons de valence faut-il répartir au total dans le schéma de Lewis ${de(e1.nom)} ${e1.formule} ? ${DONNEES} (nombre entier)`,
    aide: 'Additionnez les électrons de valence de tous les atomes de la formule (l’indice donne le nombre d’atomes), puis tenez compte de la charge : un anion a gagné des électrons, un cation en a perdu.',
    pieges: [[sommeDistincts(e1) - e1.charge, 'Il faut compter chaque atome de la formule : l’indice (H₃, O₂…) donne le nombre d’atomes du même élément.'], [S1, 'Vous avez oublié la charge de l’ion : n_T = (électrons de valence des atomes seuls) − charge.'], [S1 + e1.charge, 'Le signe de la charge est inversé : un anion a gagné des électrons (on les ajoute), un cation en a perdu (on les retire).'], [n1 / 2, 'Vous avez donné le nombre de doublets : n_T est le nombre d’électrons, il faut le doubler.'], [nbAtomes(e1), 'Vous avez compté les atomes : il faut compter les électrons de valence de chacun.']],
    expl: `${decompose(e1)} = ${S1}${e1.charge === 0 ? '' : ` ; charge ${sgn(e1.charge)} : n_T = ${S1} ${e1.charge > 0 ? '−' : '+'} ${Math.abs(e1.charge)}`} = ${n1} électrons.` };
  // 2. n_D
  const e2 = tire(AVEC_LEWIS.filter(e => e.id !== e1.id)), T2 = nT(e2.graphe), n2 = nDoublets(e2.graphe);
  const q2 = { id: 'br1', type: 'num', unite: 'doublets', vrai: n2, tolRel: 0, csMin: String(n2).length,
    q: `Combien de doublets d’électrons faut-il répartir dans le schéma de Lewis ${de(e2.nom)} ${e2.formule} ? ${DONNEES} (nombre entier)`,
    aide: 'Calculez d’abord le nombre total d’électrons de valence (atomes seuls, corrigé de la charge), puis divisez par 2 : un doublet contient deux électrons.',
    pieges: [[T2, 'C’est le nombre d’électrons : un doublet en contient deux, il faut diviser par 2.'], [(sommeValences(e2) + e2.charge) / 2, 'Le signe de la charge est inversé : un anion a gagné des électrons, un cation en a perdu.'], [sommeValences(e2) / 2, 'Vous avez oublié la charge de l’ion dans le nombre total d’électrons.'], [T2 * 2, 'Un doublet contient deux électrons : il faut diviser par 2, pas multiplier.']],
    expl: `n_T = ${T2} électrons, donc n_D = frac(${T2}|2) = ${n2} doublets.` };
  // 3. doublets non liants
  const e3 = tire(AVEC_LEWIS.filter(e => e.id !== e1.id && e.id !== e2.id && nDoubletsNonLiants(e.graphe) > 0)), b3 = nDoubletsLiants(e3.graphe), d3 = nDoublets(e3.graphe), l3 = d3 - b3;
  const q3 = { id: 'br2', type: 'num', unite: 'doublets', vrai: l3, tolRel: 0, csMin: String(l3).length,
    q: `Le schéma de Lewis ${de(e3.nom)} ${e3.formule} comporte ${b3} doublets liants (une liaison double compte pour 2). Combien de doublets non liants comporte-t-il ? ${DONNEES} (nombre entier)`,
    aide: 'Le nombre total de doublets est la moitié de n_T. Les doublets non liants sont ceux qui ne sont pas liants : total moins doublets liants.',
    pieges: [[d3, 'C’est le nombre total de doublets : il faut en retirer les doublets liants.'], [b3, 'C’est le nombre de doublets liants : on demande les doublets non liants.'], [d3 + b3, 'Il faut retirer les doublets liants du total, pas les ajouter.'], [nT(e3.graphe) - b3, 'Vous avez retiré les doublets liants du nombre d’électrons : il faut d’abord diviser n_T par 2 pour avoir des doublets.']],
    expl: `n_T = ${nT(e3.graphe)} électrons, soit ${d3} doublets au total ; doublets non liants = ${d3} − ${b3} = ${l3}.` };
  // 4. charge d'une espèce dans une équation acide-base
  const r = tire(REACTIONS_DEFI), pos = tire([0, 1]), X = r.produits[pos], autre = r.produits[1 - pos];
  const eX = TOUTES_ESPECES.find(e => e.id === X.id), eA = TOUTES_ESPECES.find(e => e.id === autre.id), qR = r.reactifs.reduce((t, { id, n }) => t + n * TOUTES_ESPECES.find(e => e.id === id).charge, 0), qA = autre.n * eA.charge;
  const sansCharge = f => f.replace(/[²³]?[⁺⁻]$/, '');
  const eqTxt = `${r.reactifs.map(texteTerme).join(' + ')} → ${pos === 0 ? sansCharge(eX.formule) + '(?)' : texteTerme(autre)} + ${pos === 0 ? texteTerme(autre) : sansCharge(eX.formule) + '(?)'}`;
  const q4 = { id: 'br3', type: 'num', unite: 'e', vrai: eX.charge, tolRel: 0, csMin: 1,
    q: `Dans l’équation de réaction acide-base ${eqTxt}, la charge de l’espèce notée (?) n’est pas écrite. Quelle charge porte-t-elle, en unités de charge élémentaire e, pour que la charge soit conservée ? (écrivez par exemple +1, −1, −2 ou 0)`,
    aide: 'La charge totale des réactifs est égale à la charge totale des produits : charge de (?) = charge des réactifs − charge de l’autre produit.',
    pieges: [[-eX.charge, 'Le signe est inversé : vérifiez que la somme des charges des produits est égale à celle des réactifs.'], [0, 'L’espèce n’est pas neutre : les charges des réactifs ne se compensent pas avec celle de l’autre produit seule.'], [qA, 'C’est la charge de l’autre produit : il faut la retrancher de la charge des réactifs.'], [qR, 'C’est la charge totale des réactifs : il faut en retrancher la charge de l’autre produit.'], [eX.charge + 1, 'Recomptez : charge de (?) = charge des réactifs − charge de l’autre produit.'], [eX.charge - 1, 'Recomptez : charge de (?) = charge des réactifs − charge de l’autre produit, avec les signes.'], [eX.charge + 2, 'Recomptez la charge de chaque espèce, avec son signe, avant de faire la différence.']],
    expl: `Charge des réactifs : ${sgn(qR)} ; autre produit : ${sgn(qA)} ; charge de (?) = ${sgn(qR)} − (${sgn(qA)}) = ${sgn(eX.charge)}${NB}e, soit ${eX.formule}.` };
  const qs = [q1, q2, q3, q4];
  qs.forEach(q => { q.pieges = q.pieges.filter(([v], i, t) => Number.isFinite(v) && v !== q.vrai && t.findIndex(([w]) => w === v) === i); });
  return { intro: 'Transferts de H⁺ : électrons de valence et doublets d’un schéma de Lewis, doublets non liants, charge dans une équation acide-base.', questions: qs,
    retenir: ['n_T = somme des électrons de valence des atomes seuls − charge de l’espèce ; n_D = frac(n_T|2).', 'Doublets non liants = n_D − doublets liants (une liaison double compte pour 2).', 'Dans une équation acide-base, atomes et charge sont conservés : la charge totale des réactifs est égale à celle des produits.'] };
}
void chargeTxt;
