import assert from 'node:assert/strict';
import * as M from './tsolModele.js';
const { SOLIDES: S } = M;
// valeurs aux nœuds et interpolation
assert.equal(M.sol(S.nh4cl, 20), 37.2); assert.equal(M.sol(S.nh4cl, 100), 77.3); assert.equal(M.sol(S.nh4cl, -5), 29.4); assert.equal(M.sol(S.nh4cl, 130), 77.3);
assert.ok(Math.abs(M.sol(S.nh4cl, 30) - 41.5) < 1e-9);
for (const k of M.ORDRE) { const so = S[k]; for (let T = 0; T < 100; T += 5) { const d = M.sol(so, T + 5) - M.sol(so, T); assert.ok(so.sens === 'croissante' ? d > 0 : d < 0, `monotonie ${k} ${T}`); } }
// états
let e = M.etat(S.nh4cl, 20, 40, 100); assert.ok(Math.abs(e.cristaux - 2.8) < 1e-9 && e.statut === 'depot' && Math.abs(e.dissous - 37.2) < 1e-9);
e = M.etat(S.nh4cl, 40, 40, 100); assert.equal(e.statut, 'sous'); assert.equal(e.cristaux, 0);
e = M.etat(S.nh4cl, 20, 37.2, 100); assert.equal(e.statut, 'limite');
// cristallisation, eau minimale, rendement (valeurs des énoncés)
assert.ok(Math.abs(M.cristallise(S.nh4cl, 200, 80, 20) - 56.8) < 1e-9);
assert.ok(Math.abs(M.cristallise(S.nh4cl, 100, 60, 20) - 18) < 1e-9);
assert.ok(Math.abs(M.eauMin(S.nh4cl, 50, 60) - 90.58) < 0.01);
assert.ok(Math.abs(M.rendement(S.nh4cl, 80, 0) - 0.5518) < 0.001);
assert.equal(M.cristallise(S.nh4cl, 100, 20, 80), 0);                     // on chauffe : rien ne cristallise
assert.ok(M.cristallise(S.li2co3, 500, 20, 80) > 2.3 && M.cristallise(S.li2co3, 500, 20, 80) < 2.5);  // solubilité décroissante : le dépôt se forme en chauffant
assert.equal(M.cristallise(S.li2co3, 500, 80, 20), 0);
// température de saturation
assert.ok(Math.abs(M.tSat(S.nh4cl, 55.2) - 60) < 0.01); assert.equal(M.tSat(S.nh4cl, 10), null); assert.ok(Math.abs(M.tSat(S.li2co3, 1.01) - 60) < 0.01);
// défis : 3000 tirages, justesse, faisabilité avec une lecture décalée de ±1 g/100 g sur chaque solubilité, tolérance
let n = 0;
for (let i = 0; i < 3000; i++) {
  const d = M.tirageDefiCristal(); n++;
  assert.ok(d.vrai > 20 && d.vrai < 400);
  assert.ok(M.diagCristal(d, d.vrai).ok);
  for (const ds1 of [-1, 0, 1]) for (const ds2 of [-1, 0, 1]) assert.ok(M.diagCristal(d, (d.s1 + ds1 - d.s2 - ds2) * d.mEau / 100).ok, 'lecture ±1');
  assert.ok(!M.diagCristal(d, d.s1 * d.mEau / 100).ok); assert.ok(!M.diagCristal(d, d.s2 * d.mEau / 100).ok); assert.ok(!M.diagCristal(d, d.s1 - d.s2).ok);
  assert.ok(!M.diagCristal(d, NaN).ok);
  const g = M.tirageDefiEau();
  assert.ok(M.diagEau(g, g.vrai).ok); for (const ds of [-1, 0, 1]) assert.ok(M.diagEau(g, 100 * g.m / (g.s + ds)).ok, 'lecture eau ±1');
  assert.ok(!M.diagEau(g, g.m * g.s / 100).ok && !M.diagEau(g, g.m / g.s).ok);
}
console.log('tsolModele : OK (' + n + ' tirages)');
