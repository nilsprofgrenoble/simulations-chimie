// ====================================================
//  Exercice « calcul » de la simulation 186 (mécanismes réactionnels) : tirage pur, sans React, testable avec node
//  (mrxExos.test.mjs relit le texte affiché et refait le calcul). Les nombres sont écrits en décimales fixes.
// ====================================================
import { parseFormule, listeActes, ecrireEquation, TOUS_MECANISMES } from './mrxModele.js';
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const ELEMENTS = [['H', 'd’hydrogène'], ['O', 'd’oxygène'], ['C', 'de carbone']];
// atomes d'un élément dans une liste de termes {f, n}
export const compterAtomes = (termes, el) => termes.reduce((t, { f, n }) => t + n * (parseFormule(f).atomes[el] || 0), 0);
// tire : fonction (tableau) → élément ; l'appelant fournit le hasard
export function tirageCalcul(tire) {
  const actes = TOUS_MECANISMES.flatMap(m => listeActes(m).map((a, i) => ({ m, i, a })));
  let A, el, nom, q;
  for (let k = 0; k < 200; k++) { A = tire(actes); [el, nom] = tire(ELEMENTS); q = compterAtomes(A.a.react, el); if (q >= 2 && q <= 9) break; }
  const eq = ecrireEquation(A.a.react, A.a.prod), nEsp = A.a.react.filter(({ f }) => parseFormule(f).atomes[el]).length;
  const q1 = { id: 'mx0', type: 'num', unite: 'atomes', vrai: q, tolRel: 0.006, csMin: 1,
    q: `Un mécanisme fourni comporte l’acte élémentaire ${eq}. Combien d’atomes ${nom} y a-t-il dans les réactifs de cet acte ? (nombre entier)`,
    aide: 'Pour chaque réactif, lisez les indices de la formule (H₂O compte 2 atomes d’hydrogène et 1 atome d’oxygène), multipliez par le coefficient de l’espèce, puis additionnez.',
    pieges: [[nEsp, 'Vous avez compté les espèces qui contiennent cet élément, pas ses atomes : lisez les indices des formules.'], [q + 1, 'Recomptez les atomes un par un, en tenant compte de chaque indice : vous en avez compté un de trop.'], [Math.max(1, q - 1), 'Recomptez les atomes un par un, en tenant compte de chaque indice : il en manque un.']],
    expl: `Réactifs : ${A.a.react.map(({ f, n }) => `${f} compte ${n * (parseFormule(f).atomes[el] || 0)}`).join(', ')} ; au total ${q} atomes ${nom}. Les produits en contiennent autant : les atomes sont conservés dans un acte élémentaire.` };
  const f = tire([2.0, 3.0, 4.0, 5.0, 6.0, 8.0, 10.0]), p = tire([5, 10, 12, 20, 25]), vrai2 = f * p / 100;
  const q2 = { id: 'mx1', type: 'num', unite: 's⁻¹', vrai: vrai2, tolRel: 0.05, csMin: 2,
    q: `Dans une boîte, on compte ${d(f, 1)}${NB}chocs par seconde entre des entités A et des entités B ; ${p}${NB}% de ces chocs sont efficaces. Combien de chocs efficaces par seconde ? (en s⁻¹, 2 chiffres significatifs)`,
    aide: 'Chocs efficaces par seconde = (chocs par seconde) × (part de chocs efficaces), la part étant écrite comme un nombre inférieur à 1 (p % = frac(p|100)).',
    pieges: [[f * p, 'Vous avez oublié de convertir le pourcentage : p % = frac(p|100).'], [f / (p / 100), 'Il faut multiplier le nombre de chocs par la part efficace, pas le diviser par elle.'], [f - p / 100, 'Il faut multiplier : la part efficace est une proportion des chocs, pas un nombre de chocs à retrancher.']],
    expl: `Chocs efficaces par seconde = ${d(f, 1)} × frac(${p}|100) = ${d(vrai2, 2)} s⁻¹.` };
  const N = tire([200, 400, 500]), p3 = tire([5, 10, 12, 20, 25]), E = N * p3 / 100, D = tire([20, 40, 50, 60]);
  const q3 = { id: 'mx2', type: 'num', unite: '%', vrai: p3, tolRel: 0.05, csMin: 2,
    q: `Pendant ${D}${NB}s, on compte ${N}${NB}chocs entre A et B, dont ${E}${NB}chocs efficaces. Quelle part des chocs est efficace ? (en %)`,
    aide: 'Part efficace = frac(nombre de chocs efficaces|nombre total de chocs), puis × 100 pour l’exprimer en pourcentage. La durée ne sert pas ici.',
    pieges: [[E / N, 'Vous avez donné une proportion : multipliez par 100 pour l’exprimer en pourcentage.'], [E / D, 'Vous avez calculé des chocs efficaces par seconde : on demande la part des chocs, rapportée au nombre total de chocs.'], [100 * N / E, 'Le rapport est inversé : il faut diviser les chocs efficaces par le nombre total de chocs.']],
    expl: `Part efficace = frac(${E}|${N}) = ${d(E / N, 2)}, soit ${p3}${NB}% (la durée de ${D}${NB}s ne sert pas).` };
  const n = tire([0.40, 0.60, 0.80, 1.0, 1.2, 1.6]), vrai4 = n / 2;
  const q4 = { id: 'mx3', type: 'num', unite: 'mol', vrai: vrai4, tolRel: 0.05, csMin: 2,
    q: `La décomposition de l’eau oxygénée est catalysée par les ions iodure. Mécanisme fourni : acte 1, H₂O₂ + I⁻ → H₂O + IO⁻ ; acte 2, H₂O₂ + IO⁻ → H₂O + O₂ + I⁻. On décompose entièrement ${d(n, 2)}${NB}mol de H₂O₂. Quelle quantité de dioxygène se forme ? (en mol, 2 chiffres significatifs)`,
    aide: 'Additionnez les deux actes et simplifiez (IO⁻ et I⁻ disparaissent) pour obtenir l’équation de la réaction ; lisez ensuite le rapport entre H₂O₂ consommé et O₂ formé.',
    pieges: [[n, 'Vous avez pris un rapport 1 pour 1 : l’équation de la réaction est 2 H₂O₂ → 2 H₂O + O₂, il se forme une mole de O₂ pour deux moles de H₂O₂.'], [2 * n, 'Le rapport est inversé : il se forme moins de O₂ que de H₂O₂ consommé.'], [n / 4, 'Vous avez divisé deux fois : une mole de O₂ se forme pour deux moles de H₂O₂, pas pour quatre.']],
    expl: `Acte 1 + acte 2 : 2 H₂O₂ → 2 H₂O + O₂ (I⁻ et IO⁻ disparaissent du bilan). n(O₂) = frac(${d(n, 2)}|2) = ${d(vrai4, 2)} mol.` };
  const qs = [q1, q2, q3, q4];
  qs.forEach(q => { const seuil = Math.max(1.5 * q.tolRel, 0.02); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); });
  return { intro: 'Mécanismes réactionnels : atomes conservés dans un acte, chocs efficaces et bilan d’un mécanisme.', questions: qs,
    retenir: ['Dans un acte élémentaire (comme dans un bilan), les atomes de chaque élément et la charge sont conservés : on les compte avec les indices des formules.', 'Chocs efficaces par seconde = (chocs par seconde) × (part de chocs efficaces) ; la part efficace est le nombre de chocs efficaces rapporté au nombre total de chocs.', 'Bilan d’un mécanisme : on additionne les actes puis on simplifie ; intermédiaires et catalyseur disparaissent, et les coefficients de l’équation donnent les rapports entre quantités de matière.'] };
}
