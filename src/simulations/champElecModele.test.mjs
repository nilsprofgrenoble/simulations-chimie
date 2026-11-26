import assert from 'node:assert/strict';
import * as M from './champElecModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const pr = (a, b, t) => Math.abs(a - b) <= t * Math.abs(b);
ok(pr(M.PARCOURS.E, 1.0e4, 1e-12), 'E parcours'); ok(pr(M.PARCOURS.F, 1.6e-15, 1e-9), 'F parcours'); ok(pr(M.PARCOURS.E2, 1.5e4, 1e-9), 'E2'); ok(pr(M.PARCOURS.U2, 300, 1e-9), 'U2');
ok(pr(M.champ(200, 0.02), 1e4, 1e-12), 'E=U/d'); ok(pr(M.champ(100, 0.02), M.champ(200, 0.02) / 2, 1e-12), 'E ∝ U'); ok(pr(M.champ(200, 0.04), M.champ(200, 0.02) / 2, 1e-12), 'E ∝ 1/d');
ok(M.sensForce(-1e-19) === -1 && M.sensForce(2e-19) === 1 && M.sensForce(0) === 0, 'sens');
ok(pr(M.force(-3.2e-19, 1e4), 2 * M.force(1.6e-19, 1e4), 1e-12), 'F ∝ |q|');
ok(pr(M.tension(M.champ(250, 0.025), 0.025), 250, 1e-12), 'U = E d');
// doubler q et d à U fixe : F inchangée
ok(pr(M.force(2 * 1.6e-19, M.champ(200, 0.04)), M.force(1.6e-19, M.champ(200, 0.02)), 1e-12), 'q×2, d×2 : F inchangée');
for (let i = 0; i < 3000; i++) {
  const a = M.tirageDefiChamp(), b = M.tirageDefiForce();
  ok(a.E >= 1 && a.E <= 30, `E ${a.E}`); ok(b.F > 0.2 && b.F < 70, `F ${b.F}`); ok(Math.abs(b.F - b.n * 1.6e-19 * b.E * 1e3 * 1e15) < 1e-9 * b.F, 'F');
}
console.log(`champElecModele : ${n} vérifications OK`);
