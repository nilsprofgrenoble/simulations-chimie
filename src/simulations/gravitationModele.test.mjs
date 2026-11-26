import assert from 'node:assert/strict';
import * as M from './gravitationModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const pr = (a, b, t) => Math.abs(a - b) <= t * Math.abs(b);
ok(pr(M.PARCOURS.F * 1e6, 16.675, 1e-9), 'F parcours'); ok(pr(M.PARCOURS.gT, 9.81, 0.003), 'g Terre'); ok(pr(M.gAlt(M.CORPS.lune.M, M.CORPS.lune.R), 1.62, 0.01), 'g Lune');
ok(pr(M.gAlt(M.CORPS.mars.M, M.CORPS.mars.R), 3.72, 0.01), 'g Mars'); ok(pr(M.gAlt(M.CORPS.jupiter.M, M.CORPS.jupiter.R), 24.8, 0.01), 'g Jupiter');
ok(pr(M.PARCOURS.PL, 113.3, 0.01), 'P Lune'); ok(pr(M.PARCOURS.gH, 8.69, 0.005), 'g à 400 km'); ok(pr(M.PARCOURS.gH / M.PARCOURS.gT, 0.886, 0.005), 'rapport');
ok(pr(M.force(1, 1, 2), M.force(1, 1, 1) / 4, 1e-12), 'F en 1/d²'); ok(pr(M.force(2, 1, 1), 2 * M.force(1, 1, 1), 1e-12), 'F en m'); ok(M.force(3, 5, 7) === M.force(5, 3, 7), 'symétrie');
for (let i = 0; i < 3000; i++) {
  const a = M.tirageDefiForce(), b = M.tirageDefiPoids();
  ok(a.F > 1 && a.F < 500, `F µN ${a.F}`); ok(b.g > 1 && b.g < 30, `g ${b.g}`); ok(Math.abs(b.P - b.m * b.g) < 1e-9, 'P');
}
console.log(`gravitationModele : ${n} vérifications OK`);
