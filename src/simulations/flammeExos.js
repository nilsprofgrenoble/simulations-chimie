// Exercices de calcul (REA) de la sim 313 « Atomes dans une flamme » : tirage pur, testé par flammeExos.test.mjs.
//  • tirageFlamme : écart d'énergie d'une raie atomique (eV), absorbance à partir de I et I₀, concentration par étalonnage (domaine linéaire)
import { ELEMENTS, HC } from './flammeModele.js';
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const arr = (x, k) => Number(Number(x).toFixed(k));
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };

export function tirageFlamme(tire) {
  const e = tire(ELEMENTS.filter(x => ['Na', 'Li', 'K', 'Cu', 'Mg'].includes(x.s))), lam = arr(e.lam, 1), E = HC / lam;
  const I0 = tire([800, 1000, 1200, 2000]), T = tire([0.20, 0.25, 0.40, 0.50, 0.63]), I = Math.round(I0 * T), A = -Math.log10(I / I0);
  const cEt = tire([1, 2, 5]), AEt = tire([0.20, 0.30, 0.40]), AEch = tire([0.10, 0.15, 0.25, 0.35]), c = cEt * AEch / AEt;
  const intro = `On étudie le ${e.nom} (${e.s}) par spectrométrie atomique dans une flamme. Sa raie de résonance est à ${d(lam, 1)}${NB}nm. Constante : h·c = 1240${NB}eV·nm.`;
  const q1 = { id: 'fm0', type: 'num', unite: 'eV', vrai: E, tolRel: 0.03, csMin: 3,
    q: 'Calculez l’écart d’énergie entre les deux niveaux de la transition, en eV (3 chiffres significatifs).',
    aide: 'E(eV) = 1240 / λ(nm).',
    pieges: [[lam / 1240, 'Vous avez divisé λ par h·c : il faut diviser h·c par λ.'], [E * 1000, 'Il y a une erreur d’une puissance de 10 sur le résultat.'], [E * 1.602e-19, 'Cette valeur est en joules ; l’énoncé demande des eV.']],
    expl: `E = h·c / λ = 1240 / ${d(lam, 1)} ≈ ${d(E, 2)}${NB}eV.` };
  const q2 = { id: 'fm1', type: 'num', unite: '', vrai: A, tolRel: 0.05, csMin: 2,
    q: `En absorption atomique, la lampe envoie une intensité I₀ = ${I0} (unités arbitraires) et le détecteur reçoit I = ${I}. Calculez l’absorbance A (2 chiffres significatifs).`,
    aide: 'A = −log(I / I₀), avec le logarithme décimal.',
    pieges: [[I / I0, 'Vous avez donné la transmittance T = I / I₀ : l’absorbance est A = −log T.'], [-Math.log(I / I0), 'Vous avez utilisé le logarithme népérien : A = −log T avec le logarithme décimal.'], [-A, 'Une absorbance est positive : A = −log T avec T < 1.']],
    expl: `T = ${I} / ${I0} = ${d(I / I0, 2)} ; A = −log(${d(I / I0, 2)}) ≈ ${d(A, 2)}. (Hypothèse : chaque photon absorbé l’est une seule fois, sans diffusion.)` };
  const q3 = { id: 'fm2', type: 'num', unite: 'mg/L', vrai: c, tolRel: 0.05, csMin: 2,
    q: `Un étalon à ${d(cEt, 1)}${NB}mg/L donne une absorbance de ${d(AEt, 2)}. L’échantillon donne ${d(AEch, 2)}. Calculez sa concentration, en mg/L, dans le domaine linéaire (2 chiffres significatifs).`,
    aide: 'A est proportionnelle à la concentration : la droite d’étalonnage passe par l’origine.',
    pieges: [[cEt * AEt / AEch, 'Vous avez inversé le rapport des absorbances : c = c(étalon) × A(échantillon) / A(étalon).'], [c * 10, 'Il y a une erreur d’une puissance de 10 sur le résultat.'], [cEt + (AEch - AEt), 'La droite passe par l’origine : on n’additionne pas les absorbances.']],
    expl: `c = ${d(cEt, 1)} × ${d(AEch, 2)} / ${d(AEt, 2)} ≈ ${d(c, 2)}${NB}mg/L (hypothèse : A proportionnelle à c, mêmes conditions pour l’étalon et l’échantillon).` };
  const qs = [q1, q2, q3]; qs.forEach(filtrePieges);
  return { intro, questions: qs, retenir: ['E(eV) = 1240 / λ(nm) : l’écart d’énergie d’une raie atomique.', 'A = −log(I / I₀) : l’absorbance mesure la lumière retirée du faisceau.', 'A ∝ c dans le domaine linéaire : c = c(étalon) × A(échantillon) / A(étalon).'] };
}
