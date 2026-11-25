// Test du modèle de la simulation 230. Lancer : node src/simulations/laserModele.test.mjs
import * as M from './laserModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC :', m); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(Math.abs(a), Math.abs(b), 1e-300);
const P = M.PARCOURS;
ok(Math.abs(M.sectionMm2(P.d) - 3.1416) < 1e-3, 'section 2,0 mm');
ok(Math.abs(M.eclairement(P.phi, P.d) - 1273.2) < 0.1, 'E = 1273 W/m²');
ok(Math.abs(M.eclairement(P.phi, M.diametre(P.d, P.theta, P.L)) - 814.9) < 0.2, 'E à 5 m ≈ 815');
ok(proche(M.energie(P.phi, 0.25), 1e-3), 'Q en 0,25 s = 1,0 mJ');
ok(proche(M.duree(P.Qgrav, P.Pgrav), 0.2), 'durée de gravure 0,20 s');
ok(Math.abs(M.fluxMax(P.d) - 31.416e-6) < 1e-9, 'φ max ≈ 31,4 µW');
ok(Math.abs(M.dureeMax(M.eclairement(P.phi, P.d)) * 1000 - 1.9635) < 1e-3, 'Δt max ≈ 1,96 ms');
ok(proche(M.E_MAX * M.T_REFLEXE, M.H_MAX), 'cohérence de la norme');
ok(M.classe(0.004) === '3R' && M.classe(0.001) === '2' && M.classe(0.05) === '3B' && M.classe(1) === '4', 'classes');
for (let phi = 0.0005; phi < 0.5; phi *= 1.3) for (let D = 0.5; D <= 4; D += 0.25) {
  const E = M.eclairement(phi, D);
  ok(proche(M.flux(E, D), phi), 'flux retrouvé');
  ok(proche(M.eclairement(phi, D / 2), 4 * E), 'D/2 → 4E');
  ok(proche(M.eclairement(3 * phi, D), 3 * E), 'proportionnel au flux');
  ok(M.dureeMax(E) > 0, 'durée > 0');
  ok(E <= M.E_MAX ? M.dureeMax(E) === Infinity : proche(M.dureeMax(E) * E, M.H_MAX), 'Δt max');
  ok(proche(M.eclairement(M.fluxMax(D), D), M.E_MAX), 'flux max → E_MAX');
}
for (let i = 0; i < 5000; i++) { const a = M.tirageDefiA(), b = M.tirageDefiB();
  ok(a.E >= 200 && a.tMs >= 0.1 && isFinite(a.tMs), 'défi A'); ok(b.Q > 0 && b.Emm > 0, 'défi B'); }
console.log(ko ? `${ko} ÉCHEC(S)` : `OK : ${n} vérifications, 0 échec.`);
process.exit(ko ? 1 : 0);
