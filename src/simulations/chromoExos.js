// Exercices de calcul (REA) de la sim 303 « UV-visible : couleur, conjugaison et auxochromes » : tirage pur, testé par chromoExos.test.mjs.
//  • tirageChromo : absorbance A = ε·l·c, concentration à partir de A, énergie du photon absorbé à λmax, transmittance
import { MOLS } from './chromoModele.js';
const NB = ' ';
const d = (x, k) => Number(x).toFixed(k).replace('.', ',').replace('-', '−');
const filtrePieges = q => { const seuil = Math.max(1.5 * q.tolRel, 0.08); q.pieges = q.pieges.filter(([v]) => Number.isFinite(v) && Math.abs(v - q.vrai) > seuil * Math.abs(q.vrai)); };
const CIBLES = ['nitrophenolate', 'nitrophenol', 'transstil', 'phenol', 'aniline', 'phenolate'];

export function tirageChromo(tire) {
  const m = MOLS[tire(CIBLES)], l = tire([0.5, 2.0, 5.0]), eps = m.eps;
  const cands = []; for (const mant of [1.0, 1.5, 2.0, 2.5, 3.0, 4.0, 5.0, 6.0, 8.0]) for (const p of [1, 10, 100, 1000]) { const a = eps * l * mant * p * 1e-6; if (a >= 0.15 && a <= 1.2) cands.push(mant * p); }
  const c = tire(cands), A = eps * l * c * 1e-6;
  const Ar = Number(A.toPrecision(2)), T = 100 * 10 ** -Ar, E = 1243 / m.lam;
  const intro = `Une solution contenant ${m.nom} (ε = ${eps}${NB}L·mol⁻¹·cm⁻¹ au maximum d’absorption, λmax = ${m.lam}${NB}nm) est placée dans une cuve de longueur l = ${d(l, 1)}${NB}cm. Sa concentration est c = ${String(c).replace(".", ",")}${NB}µmol/L. Relation de Beer-Lambert : A = ε·l·c. Pour l’énergie : E(eV) = frac(1243|λ(nm)).`;
  const q1 = { id: 'ch0', type: 'num', unite: '', vrai: A, tolRel: 0.05, csMin: 2,
    q: 'Calculez l’absorbance A de la solution au maximum d’absorption (2 chiffres significatifs). Convertissez c en mol/L.',
    aide: 'A = ε × l × c, avec c en mol/L (1 µmol/L = 10⁻⁶ mol/L). A n’a pas d’unité.',
    pieges: [[A * 1e6, 'Vous avez oublié de convertir les µmol/L en mol/L (facteur 10⁻⁶).'], [A / l, 'Vous avez oublié la longueur de cuve l.'], [A * l * l, 'Vous avez multiplié deux fois par l.'], [eps * l * 1e-6, 'Vous avez oublié la concentration c.']],
    expl: `A = ε·l·c = ${eps} × ${d(l, 1)} × ${c}·10⁻⁶ = ${d(A, 2)}.` };
  const q2 = { id: 'ch1', type: 'num', unite: 'µmol/L', vrai: Ar / (eps * l) * 1e6, tolRel: 0.05, csMin: 2,
    q: `Avec une autre solution de la même espèce dans la même cuve, on mesure A = ${d(Ar, 2)} (valeur donnée). Calculez sa concentration, en µmol/L (2 chiffres significatifs).`,
    aide: 'c = frac(A|ε × l) en mol/L, puis × 10⁶ pour obtenir des µmol/L.',
    pieges: [[Ar / (eps * l), 'Vous avez laissé la concentration en mol/L : multipliez par 10⁶ pour obtenir des µmol/L.'], [Ar * eps * l * 1e6, 'Vous avez multiplié par ε et l au lieu de diviser.'], [Ar / eps * 1e6, 'Vous avez oublié la longueur de cuve l.']],
    expl: `c = frac(A|ε·l) = ${d(Ar, 2)} / (${eps} × ${d(l, 1)}) = ${d(Ar / (eps * l), 8).replace(/0+$/, '')} mol/L = ${d(Ar / (eps * l) * 1e6, 1)}${NB}µmol/L.` };
  const q3 = { id: 'ch2', type: 'num', unite: 'eV', vrai: E, tolRel: 0.05, csMin: 3,
    q: `Calculez l’énergie d’un photon de longueur d’onde λmax = ${m.lam}${NB}nm, en eV (3 chiffres significatifs).`,
    aide: 'E(eV) = frac(1243|λ(nm)).',
    pieges: [[E * m.lam * m.lam, 'Vous avez multiplié par λ au lieu de diviser.'], [E / 1000, 'Vous avez utilisé λ en µm au lieu de nm, ou une erreur de puissance de 10.'], [E * 1000, 'Il y a une erreur de puissance de 10 : E(eV) = frac(1243|λ(nm)).']],
    expl: `E = 1243 / ${m.lam} ≈ ${d(E, 2)}${NB}eV.` };
  const q4 = { id: 'ch3', type: 'num', unite: '%', vrai: T, tolRel: 0.05, csMin: 2,
    q: `La solution précédente a une absorbance A = ${d(Ar, 2)} (valeur donnée). Calculez sa transmittance T = I/I₀ au maximum d’absorption, en % (2 chiffres significatifs).`,
    aide: 'A = −log T, donc T = 10^(−A) ; exprimez T en %.',
    pieges: [[T / 100, 'Vous avez donné T en valeur décimale : multipliez par 100 pour l’exprimer en %.'], [100 - T, 'Vous avez calculé la part de lumière absorbée (100 − T), pas la lumière transmise.'], [100 * Math.exp(-Ar), 'Vous avez utilisé e à la place de 10 : A = −log T est un logarithme décimal.']],
    expl: `T = 10^(−${d(Ar, 2)}) = ${d(T / 100, 3)} soit ${d(T, 1)}${NB}% de la lumière transmise.` };
  const qs = [q1, q2, q3, q4]; qs.forEach(filtrePieges);
  return { intro, questions: qs,
    retenir: ['A = ε·l·c (A sans unité ; c en mol/L si ε est en L·mol⁻¹·cm⁻¹).', 'T = 10^(−A) ; A = 1 correspond à 10 % de lumière transmise.', 'E(eV) = frac(1243|λ(nm)) : plus λmax est grand, plus l’énergie du photon absorbé est faible.'] };
}
