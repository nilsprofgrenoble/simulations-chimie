// Test du modèle des trous d'Young (sim 182) : node src/simulations/youngModele.test.mjs
import assert from 'node:assert';
import * as Y from './youngModele.js';

const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);
const { lam, a, D } = Y.BASE;
// 1. Interfrange du parcours : 650 nm, 0,50 mm, 2,50 m -> 3,25 mm ; laser vert -> 2,66 mm
proche(Y.interfrange(650, 0.5, 2.5), 3.25, 1e-9, 'i du laser rouge');
proche(Y.interfrange(532, 0.5, 2.5), 2.66, 1e-9, 'i du laser vert');
proche(Y.interfrange(532, 0.2, 2.5), 6.65, 1e-9, 'i pour a = 0,20 mm');
// 2. δ linéarisé : x = 1,6 mm -> 320 nm ; première frange sombre en λD/(2a) = i/2
proche(Y.deltaLin(0.5, 1.6, 2.5), 320, 1e-9, 'δ à x = 1,6 mm');
proche(Y.xSombre(0, lam, a, D), 1.625, 1e-9, '1re frange sombre = i/2');
proche(Y.deltaLin(a, Y.xBrillante(3, lam, a, D), D), 3 * lam, 1e-9, 'δ = kλ à x_k');
proche(Y.deltaLin(a, Y.xSombre(2, lam, a, D), D), 2.5 * lam, 1e-9, 'δ = (k+½)λ à la frange sombre');
// 3. Éclairement : 1 aux franges brillantes, 0 aux sombres, périodique de période i, symétrique
for (const k of [-4, 0, 1, 7]) { proche(Y.eclairement(lam, a, D, Y.xBrillante(k, lam, a, D)), 1, 1e-9, 'maximum'); assert(Y.eclairement(lam, a, D, Y.xSombre(k, lam, a, D)) < 1e-12, 'minimum'); }
proche(Y.eclairement(lam, a, D, 1.1), Y.eclairement(lam, a, D, -1.1), 1e-12, 'symétrie');
const i0 = Y.interfrange(lam, a, D); proche(Y.eclairement(lam, a, D, 0.7 + i0), Y.eclairement(lam, a, D, 0.7), 1e-9, 'périodicité');
// 4. Domaine de validité : sur toute la plage de la simulation (|x| ≤ 20 mm, D ≥ 1 m, a ≤ 1 mm) l'écart entre δ = a x / D et r2 − r1 reste très petit
let pireLin = 0;
for (const a1 of [0.1, 0.5, 1.0]) for (const D1 of [1, 1.5, 2.5, 3]) for (const x of [1, 5, 10, 20]) pireLin = Math.max(pireLin, Math.abs(Y.deltaLin(a1, x, D1) / Y.deltaExact(a1, x, D1) - 1));
assert(pireLin < 3e-4, `écart de linéarisation ${pireLin}`);
// ... et il devient grand quand x n'est plus petit devant D
assert(Math.abs(Y.deltaLin(0.5, 1000, 1) / Y.deltaExact(0.5, 1000, 1) - 1) > 0.2, 'x ≈ D : la formule ne vaut plus');
// 5. Inversions
proche(Y.lamDepuisI(2.66, 0.5, 2.5), 532, 1e-9, 'λ depuis i'); proche(Y.aDepuisI(3.25, 650, 2.5), 0.5, 1e-9, 'a depuis i'); proche(Y.DDepuisI(3.25, 650, 0.5), 2.5, 1e-9, 'D depuis i');
// 6. Comptage de franges et repères
assert.equal(Y.nMax(532, 0.5, 2.5), 14); assert.equal(Y.nbBrillantes(532, 0.5, 2.5), 15);
assert(Y.ecartCentre(10.64, 2.66) < 1e-9 && Math.abs(Y.ecartCentre(1.33, 2.66) - 1.33) < 1e-9);
// 7. Défis : toutes les combinaisons donnent 8 interfranges au moins dans la fenêtre, une image pointable, et une réponse atteignable à la tolérance
assert(Y.COMBOS_DEFI.length > 40, `peu de combinaisons : ${Y.COMBOS_DEFI.length}`);
let pire = 0, nmin = 99;
for (const c of Y.COMBOS_DEFI) for (const type of ['lambda', 'a']) {
  const d = { type, ...c, i: Y.interfrange(c.lam, c.a, c.D), vrai: type === 'lambda' ? c.lam : c.a };
  assert(Y.nMax(c.lam, c.a, c.D) >= 8, `moins de 8 interfranges : ${JSON.stringify(c)}`); nmin = Math.min(nmin, Y.nMax(c.lam, c.a, c.D));
  pire = Math.max(pire, Y.pireEcartDefi(d, 5, 0.2));
}
assert(pire < Y.TOL_DEFI - 0.02, `pire écart d'un élève soigneux : ${pire}`);
console.log(`défis : ${Y.COMBOS_DEFI.length} combinaisons, N max ≥ ${nmin}, pire écart (N ≥ 5, pointé ± 0,2 mm, 2 chiffres significatifs) = ${(100 * pire).toFixed(1)} % pour une tolérance de ${100 * Y.TOL_DEFI} %`);
// le tirage aléatoire reste dans les combinaisons
for (let k = 0; k < 200; k++) { const t = Y.tirageDefi(k % 2 ? 'a' : 'lambda'); assert(t.i >= Y.I_MIN_DEFI - 1e-9 && t.i <= Y.I_MAX_DEFI + 1e-9); }
console.log('youngModele : tous les contrôles passent');
