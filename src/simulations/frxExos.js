// Exercices de calcul (REA) de la sim 302 « Fluorescence X » : tirage pur, testé par frxExos.test.mjs.
//  • tirageFrx : énergie de la raie Kα (E_K − E_L), longueur d'onde du photon X, teneur par étalonnage
import { ELEMENTS, niveauL, intensite, HC } from './frxModele.js';
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };

export function tirageFrx(tire) {
  const e = tire(ELEMENTS.filter(x => ['Ca', 'Ti', 'Cr', 'Fe', 'Ni', 'Cu', 'Zn'].includes(x.s))), EK = arr(e.EK, 2), EL = arr(niveauL(e), 2), Ka = arr(EK - EL, 2);
  const wEt = tire([2, 5, 10]), wEch = tire(Array.from({ length: 29 }, (_, i) => 1 + i * 0.5)), IEt = Math.round(intensite(e, wEt)), I = Math.round(intensite(e, wEch)), w = wEt * I / IEt;
  const intro = `Un échantillon contenant du ${e.nom} (${e.s}, Z = ${e.Z}) est irradié par des rayons X. Les énergies de liaison des électrons sont E_K = ${d(EK, 2)}${NB}keV pour la couche K et E_L = ${d(EL, 2)}${NB}keV pour la couche L. Constante : h·c = 1,243${NB}keV·nm.`;
  const q1 = { id: 'fx0', type: 'num', unite: 'keV', vrai: Ka, tolRel: 0.05, csMin: 3,
    q: 'Un électron de la couche L comble une lacune de la couche K. Calculez l’énergie de la raie Kα émise, en keV (3 chiffres significatifs).',
    aide: 'Le photon emporte la différence d’énergie entre les niveaux K et L.',
    pieges: [[EK + EL, 'Vous avez additionné les deux énergies de liaison : le photon emporte leur différence.'], [Ka * 1000, 'Le résultat est demandé en keV : 1 keV = 1000 eV.'], [EL, 'C’est l’énergie de liaison du niveau L, pas celle du photon émis.']],
    expl: `E(Kα) = E_K − E_L = ${d(EK, 2)} − ${d(EL, 2)} = ${d(Ka, 2)}${NB}keV.` };
  const q2 = { id: 'fx1', type: 'num', unite: 'nm', vrai: HC / Ka, tolRel: 0.05, csMin: 3,
    q: `La raie Kα a une énergie de ${d(Ka, 2)}${NB}keV (valeur donnée). Calculez sa longueur d’onde, en nm (3 chiffres significatifs).`,
    aide: 'λ(nm) = 1,243 / E(keV).',
    pieges: [[HC * Ka, 'Vous avez multiplié l’énergie par h·c : il faut diviser h·c par l’énergie.'], [Ka / HC, 'Vous avez divisé l’énergie par h·c : le rapport est inversé.'], [HC / Ka * 10, 'Il y a une erreur d’une puissance de 10 sur le résultat.']],
    expl: `λ = h·c / E = 1,243 / ${d(Ka, 2)} ≈ ${d(HC / Ka, 3)}${NB}nm : le domaine des rayons X.` };
  const q3 = { id: 'fx2', type: 'num', unite: '%', vrai: w, tolRel: 0.05, csMin: 2,
    q: `On dose le ${e.nom} par sa raie Kα. Un étalon à ${d(wEt, 1)}${NB}% donne ${IEt}${NB}coups/s et l’échantillon ${I}${NB}coups/s (intensités nettes, fond soustrait). Calculez la teneur de l’échantillon, en % (2 chiffres significatifs).`,
    aide: 'L’intensité nette est proportionnelle à la teneur : la droite d’étalonnage passe par l’origine.',
    pieges: [[wEt * IEt / I, 'Vous avez inversé le rapport des intensités : w = w(étalon) × I(échantillon) / I(étalon).'], [w * 10, 'Il y a une erreur d’une puissance de 10 sur le résultat.'], [wEt + (I - IEt) / IEt, 'La droite passe par l’origine : on ne peut pas ajouter les écarts.']],
    expl: `w = ${d(wEt, 1)} × ${I} / ${IEt} ≈ ${d(w, 1)}${NB}% (hypothèse : intensité nette proportionnelle à la teneur, même matrice que l’étalon).` };
  const qs = [q1, q2, q3]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['E(Kα) = E_K − E_L : l’énergie de la raie est propre à l’élément.', 'λ(nm) = 1,243 / E(keV) : les rayons X ont une longueur d’onde de l’ordre de 0,1 nm.', 'Intensité nette ∝ teneur : w = w(étalon) × I(échantillon) / I(étalon).'] };
}
