// Test du modèle de la simulation 229 (éclairement et distance). Lancer : node src/simulations/panneauEclairementModele.test.mjs
import * as M from './panneauEclairementModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC :', m); } };
const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(Math.abs(a), Math.abs(b), 1e-300);

// valeurs de référence du parcours
const P = M.PARCOURS;
ok(proche(M.surfaceSphere(0.5), Math.PI), 'sphère 0,50 m = π');
ok(proche(M.eclairement(300, 0.5), 300 / Math.PI), 'E(0,50 m)');
ok(Math.abs(M.eclairement(300, 0.5) - 95.49) < 0.01, 'E(0,50) ≈ 95,5');
ok(proche(M.eclairement(300, 1.0), M.eclairement(300, 0.5) / 4), 'd doublée → E/4');
ok(proche(M.eclairement(300, 0.25), 4 * M.eclairement(300, 0.5)), 'd/2 → 4E');
ok(Math.abs(M.eclairement(300, 0.4) - 149.2) < 0.1, 'E(0,40) ≈ 149,2');
ok(Math.abs(M.plumRecue(300, 0.4, 37.5e-4) - 0.5595) < 0.001, 'Plum à 0,40 m');
ok(Math.abs(100 * M.partRecue(300, 0.4, 37.5e-4) - 0.1865) < 0.001, 'part reçue ≈ 0,19 %');
ok(Math.abs(M.distancePour(300, 500) - 0.2185) < 0.0005, 'd pour 500 W/m²');

// cohérence : distancePour est l'inverse de eclairement ; flux retrouve phi
for (let phi = 50; phi <= 700; phi += 13) for (let d = 0.1; d <= 1.5; d += 0.037) {
  const E = M.eclairement(phi, d);
  ok(proche(M.distancePour(phi, E), d), 'inverse distance');
  ok(proche(M.flux(E, d), phi), 'flux retrouvé');
  ok(E > 0 && isFinite(E), 'E fini');
  ok(proche(M.eclairement(phi, 2 * d), E / 4), 'loi en 1/d²');
  ok(proche(M.eclairement(2 * phi, d), 2 * E), 'proportionnel au flux');
}
// bornes du parcours : éclairement entre 0,1 et 1,5 m pour 300 W
ok(M.eclairement(300, M.D_MIN) > 400 && M.eclairement(300, M.D_MIN) < 700, 'E(0,20 m) plausible');
ok(M.eclairement(300, M.D_MAX) > 5 && M.eclairement(300, M.D_MAX) < 20, 'E(1,5 m) plausible');

// tirages des défis (5000 chacun)
for (let k = 0; k < 5000; k++) {
  const a = M.tirageDefiA();
  ok(M.D_LISTE_CM.includes(Math.round(a.d3 * 100)) && a.d3 >= 0.3, 'défi A distance');
  ok(proche(a.E3, a.phi / (4 * Math.PI * a.d3 ** 2)), 'défi A E3');
  // lecture à 3 chiffres significatifs aux distances de la liste : Φ retrouvé à mieux que 1 %
  for (const dc of M.D_LISTE_CM) { const d = dc / 100, E3 = M.arrondiCS(M.eclairement(a.phi, d), 3); ok(Math.abs(M.flux(E3, d) / a.phi - 1) < 0.01, 'lecture 3 CS → flux à 1 %'); }
  const b = M.tirageDefiB();
  ok(b.d >= 0.2 && b.d <= 1.2 && b.E >= 80, 'défi B plage');
  ok(proche(M.distancePour(b.phi, b.E), b.d), 'défi B distance');
  ok(proche(b.Pel, M.arrondiCS(b.Pel, 2)), 'défi B Pél à 2 CS');
  ok(proche(b.E * b.etaPct / 100 * b.Scm2 / 1e4, b.Pel), 'défi B cohérence Pél');
  // un élève qui arrondit E à 2 CS puis calcule d trouve d à moins de 3 % (tolérance retenue : 6 %)
  const E2 = M.arrondiCS(b.E, 2), d2 = M.distancePour(b.phi, E2);
  ok(Math.abs(d2 / b.d - 1) < 0.03, 'défi B arrondi E → d');
  ok(Math.abs(E2 / b.E - 1) < 0.06, 'défi B arrondi E');
}
console.log(ko === 0 ? `OK : ${n} vérifications, 0 échec.` : `${ko} échec(s) sur ${n}.`);
process.exit(ko ? 1 : 0);
