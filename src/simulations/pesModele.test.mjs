// node src/simulations/pesModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './pesModele.js';
const pr = (a, b, tol = 1e-9, msg = '') => assert.ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), `${msg} ${a} ≠ ${b}`);
const P0 = { v0: 10, alpha: 30, h: 2, g: 9.8 };
// valeurs du parcours guidé
pr(M.vx0(P0), 8.660254, 1e-6); pr(M.vy0(P0), 5, 1e-12);
pr(M.tSommet(P0), 5 / 9.8, 1e-12); pr(M.hauteurMax(P0), 2 + 25 / 19.6, 1e-12);
pr(M.dureeVol(P0), (5 + Math.sqrt(64.2)) / 9.8, 1e-12); pr(M.portee(P0), 11.4986, 1e-4); pr(M.vitesseSol(P0), Math.sqrt(139.2), 1e-12);
assert.equal(M.hauteurMax(P0).toFixed(2), '3.28'); assert.equal(M.dureeVol(P0).toFixed(2), '1.33'); assert.equal(M.portee(P0).toFixed(1), '11.5'); assert.equal(M.vitesseSol(P0).toFixed(1), '11.8');
// y(x) = y(t) avec t = x / vx ; arrivée au sol
for (const t of [0, 0.3, 0.9, 1.3]) pr(M.yDeX(P0, M.pos(P0, t).x), M.pos(P0, t).y, 1e-9, 'y(x)');
pr(M.pos(P0, M.dureeVol(P0)).y, 0, 1e-9, 'sol');
// conservation de l'énergie mécanique (poids seul), pour 4 corps/altitudes
for (const g of [9.8, 1.6, 3.7]) for (const h of [0, 2, 10]) { const p = { v0: 12, alpha: 40, h, g }; const e0 = M.energies(p, 0.5, 0).Em; for (let t = 0; t <= M.dureeVol(p); t += 0.1) pr(M.energies(p, 0.5, t).Em, e0, 1e-9, 'Em'); pr(M.energies(p, 0.5, M.dureeVol(p)).Ec, 0.5 * 0.5 * M.vitesseSol(p) ** 2, 1e-9, 'TEC'); }
// accélération = g ; vitesse : dérivée numérique de la position
const dt = 1e-6; for (const t of [0.2, 0.7]) { pr((M.pos(P0, t + dt).x - M.pos(P0, t - dt).x) / (2 * dt), M.vit(P0, t).x, 1e-6); pr((M.pos(P0, t + dt).y - M.pos(P0, t - dt).y) / (2 * dt), M.vit(P0, t).y, 1e-6); pr((M.vit(P0, t + dt).y - M.vit(P0, t - dt).y) / (2 * dt), -9.8, 1e-6); }
// formules de portée/flèche à h = 0
{ const p = { v0: 15, alpha: 35, h: 0, g: 3.7 }; pr(M.portee(p), p.v0 ** 2 * Math.sin(M.rad(70)) / p.g, 1e-9); pr(M.hauteurMax(p), (p.v0 * Math.sin(M.rad(35))) ** 2 / (2 * p.g), 1e-9); }
// défi 1 : faisabilité sur 3 000 tirages. Le tir « vrai » touche ; il existe plusieurs couples (v0 au pas de 0,5, α au pas de 1°) qui touchent ; v0 ∈ [5, 25]
let minCouples = 1e9;
for (let i = 0; i < 3000; i++) {
  const d = M.tirageDefiCible();
  assert.ok(M.touche({ ...d.vrai }, d.cible), 'le tir de référence doit toucher');
  assert.ok(d.vrai.v0 >= M.V0_MIN && d.vrai.v0 <= M.V0_MAX, `v0 hors plage ${d.vrai.v0}`);
  assert.ok(d.cible.x > 3 && d.cible.y >= 1, 'cible');
  if (i < 300) { let n = 0; for (let v = M.V0_MIN; v <= M.V0_MAX; v += 0.5) for (let a = 10; a <= 80; a += 1) if (M.touche({ v0: v, alpha: a, h: 0, g: d.g }, d.cible)) n++; minCouples = Math.min(minCouples, n); }
}
assert.ok(minCouples >= 3, `trop peu de couples réalisables : ${minCouples}`);
// défi 2 : la valeur attendue (calculée à partir de P et H affichés) est proche de v0 ; tolérance de 6 % tenable ; α entre 25° et 60°
let pire = 0;
for (let i = 0; i < 5000; i++) { const d = M.tirageDefiLecture(); assert.ok(Math.abs(d.vrai - d.v0) / d.v0 < 0.01, `lecture ${d.vrai} vs ${d.v0}`); pire = Math.max(pire, M.pireEcartLecture(d)); }
assert.ok(pire < 0.06, `pire écart défi 2 : ${pire}`);
console.log(`pesModele : OK (couples min ${minCouples}, pire écart défi 2 ${(100 * pire).toFixed(2)} %)`);
