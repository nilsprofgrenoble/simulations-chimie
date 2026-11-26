import assert from 'node:assert/strict';
import * as M from './penteXtModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const P = M.PARCOURS;
ok(P.c.x(4) === 12 && P.c.x(6) === 24 && P.c.x(2) === 4, 'x(t)');
ok(M.vMoy(P.c, 4, 6) === 6 && M.vInst(P.c, 4) === 5 && M.vInst(P.c, 6) === 7, 'v');
ok((P.xHaut - P.xBas) / (P.tHaut - P.tBas) === P.vTang, 'tangente en 4 passe par (2;2) et (6;22)');
const tg = M.tangente(P.c, 4); ok(tg.x0 + tg.v * (2 - 4) === 2 && tg.x0 + tg.v * (6 - 4) === 22, 'points de la tangente');
// la vitesse moyenne tend vers la vitesse instantanée quand dt diminue (polynôme du 2e degré : écart = a dt / 2)
for (const k of M.ORDRE) { const c = M.COURBES[k]; for (let t = 0.5; t <= c.tmax - 1; t += 0.5) { ok(Math.abs(M.vMoy(c, t, t + 0.001) - c.v(t)) < 0.002, `limite ${k} ${t}`); ok(Number.isFinite(c.x(t)) && c.x(t) >= c.xmin - 1e-9 && c.x(t) <= c.xmax, `bornes ${k} ${t}`); } }
for (let i = 0; i < 3000; i++) {
  const d = M.tirageDefiTangente();
  ok(Math.abs((d.x2 - d.x1) / (d.t2 - d.t1) - d.v) < 1e-9, 'défi tangente'); ok(d.x1 > -20 && d.x2 < 60, 'ordre de grandeur'); ok(Number.isInteger(d.x1 * 4) && Number.isInteger(d.x2 * 4), 'quarts'); ok(d.v !== 0, 'v non nulle');
  const e = M.tirageDefiCorde();
  ok(Math.abs(e.vMoy - e.vInst) > 0.4, 'les deux réponses diffèrent'); ok(Math.abs(e.vMoy - (e.x1 - e.x0) / e.dt) < 1e-9, 'vMoy');
}
console.log(`penteXtModele : ${n} vérifications OK`);
