import assert from 'node:assert/strict';
import * as M from './chutePlaneModele.js';
let n = 0; const pres = (a, b, e = 1e-9) => { assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`); n++; };
// cas de référence : 20 m/s à 30°
pres(M.v0x(20, 30), 17.320508075688775); pres(M.v0y(20, 30), 10); pres(M.tSommet(20, 30), 10 / 9.8); pres(M.hMax(20, 30), 100 / 19.6); pres(M.portee(20, 30), 400 * Math.sin(Math.PI / 3) / 9.8, 1e-9);
// au sommet : v_y = 0 et y = H ; à t_vol : y = 0, x = portée
for (const v0 of M.V0S) for (const a of M.ANGLES) {
  pres(M.vy(v0, a, M.tSommet(v0, a)), 0, 1e-9); pres(M.pos(v0, a, M.tSommet(v0, a)).y, M.hMax(v0, a), 1e-9);
  pres(M.pos(v0, a, M.tVol(v0, a)).y, 0, 1e-9); pres(M.pos(v0, a, M.tVol(v0, a)).x, M.portee(v0, a), 1e-9);
  pres(M.portee(v0, a), v0 * v0 * Math.sin(2 * a * Math.PI / 180) / 9.8, 1e-9);
  pres(M.vitesse(v0, a, 0), v0, 1e-9); pres(M.vitesse(v0, a, M.tVol(v0, a)), v0, 1e-9);   // même vitesse au départ et à l'arrivée (sol à sol)
}
// angle complémentaire : même portée ; 45° maximal
pres(M.portee(20, 30), M.portee(20, 60), 1e-9); for (const a of M.ANGLES) assert.ok(M.portee(20, 45) >= M.portee(20, a) - 1e-12); n++;
// indépendance de la masse : aucune masse dans le modèle (vérification par construction)
assert.equal(M.pos.length, 3); n++;
// tirages
const sr = (() => { let s = 11; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
for (let i = 0; i < 2000; i++) { const a = M.tirageDefiSommet(sr); assert.ok(a.tS > 0.5 && a.H > 1 && a.H < 40); const b = M.tirageDefiPortee(sr); assert.ok(b.D > 5 && b.D < 70); n += 2; }
pres(M.PARCOURS.v0x, 15.321, 1e-3); pres(M.PARCOURS.v0y, 12.856, 1e-3); pres(M.PARCOURS.vy1, 7.956, 1e-3); pres(M.PARCOURS.tS, 1.3119, 1e-3); pres(M.PARCOURS.H, 8.4328, 1e-3); pres(M.PARCOURS.D, 40.1, 0.1);
console.log(`chutePlaneModele : ${n} vérifications OK`);
