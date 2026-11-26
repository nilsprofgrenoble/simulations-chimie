// Contrôle du modèle de la sim 300 : node src/simulations/lumMatModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './lumMatModele.js';
const near = (a, b, r = 1e-9) => assert.ok(Math.abs(a - b) <= r * Math.abs(b), `${a} ≠ ${b}`);
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
near(M.HC_EV_NM, 1243.1, 1e-3); n++;
near(M.energieEV(450), 2.76, 2e-3); near(M.energieEV(500), 2.486, 2e-3); n += 2;
near(M.sigmaCm(5000), 2000); near(M.lamDeSigma(2000), 5000); near(M.eVDeSigma(1700), 0.2113, 2e-3); n += 3;
near(M.energieEV(M.lamDeEV(3.1)), 3.1); near(M.eVDeSigma(M.sigmaCm(600)), M.energieEV(600)); n += 2;
for (const [l, id] of [[300, 'uv'], [550, 'vis'], [1500, 'pir'], [5000, 'ir'], [1e6, 'fir'], [5, 'x']]) { ok(M.domaineDe(l).id === id, `${l} nm`); }
// visible : 1,6 à 3,1 eV ; IR moyen : 0,06 à 0,5 eV ; chaque domaine de transition cohérent avec les ordres de grandeur
ok(M.energieEV(780) > 1.5 && M.energieEV(400) < 3.2, 'visible');
ok(M.energieEV(2500) >= 0.49 && M.energieEV(20000) >= 0.06 - 1e-3, 'IR moyen');
ok(M.ordresGrandeur.rot.max < M.ordresGrandeur.vib.min && M.ordresGrandeur.vib.max < M.ordresGrandeur.el.min + 1e-9 || M.ordresGrandeur.vib.max <= M.ordresGrandeur.el.min, 'Erot << Evib << Eel');
ok(M.MOL.rot < M.MOL.vib && M.MOL.vib < M.MOL.el, 'ordre MOL');
// hydrogène
near(M.raieH(3, 2), 658, 3e-3); near(M.raieH(4, 2), 487, 3e-3); near(M.raieH(5, 2), 435, 3e-3); near(M.raieH(2, 1), 122, 5e-3); n += 4;
for (let k = 3; k <= 6; k++) ok(M.raieH(k, 2) > 380 && M.raieH(k, 2) < 700, 'Balmer visible');
ok(M.raieH(3, 1) < 120 && M.raieH(4, 3) > 1800, 'Lyman et Paschen');
near(M.absorbance(0.25), 0.602, 2e-3); near(M.transmittance(1), 0.1); near(M.transmittance(M.absorbance(0.37)), 0.37); n += 3;
// défis
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
for (let i = 0; i < 400; i++) {
  const d = M.tirageDefiIR(rnd); ok(d.lamUm > 2.5 && d.lamUm < 20 && d.eV > 0.05 && d.eV < 0.5, 'défi IR');
  const h = M.tirageDefiH(rnd); ok(h.ni > h.nf && h.nf >= 1 && h.ni <= 6 && h.lamNm > 90 && h.lamNm < 2200, 'défi H');
}
console.log(`Modèle sim 300 : ${n} vérifications réussies.`);
