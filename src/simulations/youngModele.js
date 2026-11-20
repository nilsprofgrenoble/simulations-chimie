// ====================================================
//  Modèle de la simulation 182 : trous d'Young (Terminale générale, « Interférences de deux ondes lumineuses »).
//  Test : node src/simulations/youngModele.test.mjs
//  Réutilise ondesModele.js (sans le modifier) : interfrange, distanceFentes, lambdaDepuisInterfrange, rgbLambda, nomCouleur.
//  Hypothèses du modèle (reprises dans le panneau « Hypothèses de travail ») :
//   • onde lumineuse monochromatique, sinusoïdale, progressive (laser) ; les deux trous S1 (en haut) et S2 (en bas) sont éclairés en phase ;
//   • trous supposés ponctuels et identiques : l'enveloppe de diffraction de chaque trou est IGNORÉE (toutes les franges ont le même éclat) ;
//   • milieu homogène (air) ; écran plan parallèle à la plaque, à la distance D ; D très grande devant a et x très petit devant D ;
//   • expression linéarisée de la différence de chemin : δ = a x / D (donnée par le programme) ;
//   • x est une abscisse algébrique (positive vers le haut), mesurée depuis le centre O de l'écran, sur la médiatrice de S1S2 ; δ = r2 − r1 > 0 pour x > 0.
//  Unités des fonctions : λ en nm, a en mm, D en m, x et i en mm, δ en nm (sauf indication contraire).
// ====================================================
import * as O from './ondesModele.js';

export const BASE = { lam: 650, a: 0.50, D: 2.5 };                 // parcours : laser rouge ; a en mm, D en m
export const AUTRE_LASER = 532;                                      // nm : laser vert de la partie « mesure » du parcours
export const DEMI_FENETRE = 20;                                      // mm : l'écran montre x de −20 mm à +20 mm
export const POINTE = 0.3;                                           // mm : incertitude de pointé de l'ordre de grandeur indiqué à l'élève (valeur de la simulation)
export const PAS_REPERE = 0.1;                                       // mm : pas des repères

const arr = x => Math.round(x * 1e6) / 1e6;
// Interfrange i = λ D / a (mm)
export const interfrange = (lam, a, D) => O.interfrange(a * 1e-3, lam * 1e-9, D) * 1e3;
// Différence de chemin linéarisée δ = a x / D (nm) ; exacte r2 − r1 (nm) pour contrôler le domaine de validité
export const deltaLin = (a, x, D) => (a * 1e-3) * (x * 1e-3) / D * 1e9;
export const deltaExact = (a, x, D) => (Math.hypot(D, x * 1e-3 + a * 1e-3 / 2) - Math.hypot(D, x * 1e-3 - a * 1e-3 / 2)) * 1e9;
// Position (mm) de la k-ième frange brillante et de la frange sombre d'ordre k (entre les franges brillantes k et k+1)
export const xBrillante = (k, lam, a, D) => k * interfrange(lam, a, D);
export const xSombre = (k, lam, a, D) => (k + 0.5) * interfrange(lam, a, D);
// Éclairement relatif en x (mm) : cos²(π δ / λ), 1 au centre de chaque frange brillante, 0 au centre de chaque frange sombre
export const eclairement = (lam, a, D, x) => Math.cos(Math.PI * deltaLin(a, x, D) / lam) ** 2;
// Inversions
export const lamDepuisI = (i, a, D) => O.lambdaDepuisInterfrange(i * 1e-3, a * 1e-3, D) * 1e9;     // nm
export const aDepuisI = (i, lam, D) => O.distanceFentes(i * 1e-3, lam * 1e-9, D) * 1e3;             // mm
export const DDepuisI = (i, lam, a) => i * 1e-3 * a * 1e-3 / (lam * 1e-9);                          // m
// Nombre de franges brillantes visibles dans la fenêtre (|x| ≤ demi-fenêtre)
export const nbBrillantes = (lam, a, D, W = DEMI_FENETRE) => 2 * Math.floor(W / interfrange(lam, a, D)) + 1;
// Plus grand nombre d'interfranges mesurable dans la fenêtre (repères sur deux franges brillantes)
export const nMax = (lam, a, D, W = DEMI_FENETRE) => 2 * Math.floor(W / interfrange(lam, a, D));
// Écart du repère x au centre d'une frange brillante (mm)
export const ecartCentre = (x, i) => Math.abs(x / i - Math.round(x / i)) * i;
export const nom = O.nomCouleur, rgb = O.rgbLambda;

// ---------- défis : retrouver λ ou a à partir d'une image ----------
export const A_DEFI = [0.30, 0.40, 0.50, 0.60, 0.80], D_DEFI = [1.5, 2.0, 2.5, 3.0], LAM_DEFI = [450, 470, 500, 532, 560, 600, 633, 650, 680];
export const I_MIN_DEFI = 2.0, I_MAX_DEFI = 5.0;                      // mm : au moins 8 interfranges dans la fenêtre, interfranges assez larges pour être pointés
export const TOL_DEFI = 0.08;                                          // tolérance relative sur la réponse
export const COMBOS_DEFI = (() => {
  const L = [];
  for (const lam of LAM_DEFI) for (const a of A_DEFI) for (const D of D_DEFI) { const i = interfrange(lam, a, D); if (i >= I_MIN_DEFI && i <= I_MAX_DEFI) L.push({ lam, a, D }); }
  return L;
})();
const tire = (t, rnd) => t[Math.floor(rnd() * t.length)];
export function tirageDefi(type, rnd = Math.random) {
  const c = tire(COMBOS_DEFI, rnd);
  return { type, ...c, i: interfrange(c.lam, c.a, c.D), vrai: type === 'lambda' ? c.lam : c.a };
}
// Réponse d'un élève qui a pointé N interfranges avec des erreurs de pointé e1 et e2 (mm) sur les deux repères, puis calculé sans arrondir
export function reponseEleve(d, N, e1 = 0, e2 = 0) {
  const dist = N * d.i + e2 - e1, i = dist / N;
  return d.type === 'lambda' ? lamDepuisI(i, d.a, d.D) : aDepuisI(i, d.lam, d.D);
}
// Pire écart relatif (pointé de ±eMax par repère, N ≥ Nmin interfranges, arrondi à 2 chiffres significatifs)
export function pireEcartDefi(d, Nmin = 5, eMax = 0.2) {
  let pire = 0;
  const sig2 = v => Number(v.toPrecision(2));
  for (let N = Nmin; N <= nMax(d.lam, d.a, d.D); N++) for (const e1 of [-eMax, eMax]) for (const e2 of [-eMax, eMax]) {
    const r = reponseEleve(d, N, e1, e2);
    pire = Math.max(pire, Math.abs(sig2(r) - d.vrai) / d.vrai, Math.abs(r - d.vrai) / d.vrai);
  }
  return arr(pire);
}
