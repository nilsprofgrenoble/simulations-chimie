// Test du modèle « transferts thermiques » (sim 235) : node src/simulations/transfertsThermModele.test.mjs
import * as M from './transfertsThermModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b);
ok(proche(M.flux(15, 0.05), 300) && proche(M.resistance(10, 250), 0.04) && proche(M.ecart(300, 0.05), 15), 'φ = ΔT / R');
ok(proche(M.fluxDepuisEnergie(7200, 120), 60), 'φ = Q / Δt');
ok(proche(M.kWh(M.energie(300, 3 * 3600)), 0.9), 'E en kWh');
ok(M.flux(15, 0.24) < M.flux(15, 0.11) && M.flux(15, 0.30) < M.flux(15, 0.05), 'plus R est grande, moins le flux est grand');
ok(proche(M.flux(30, 0.10), 2 * M.flux(15, 0.10)) && proche(M.flux(15, 0.2), M.flux(15, 0.1) / 2), 'proportionnalités');
for (let k = 0; k < 3000; k++) {
  const a = M.tirageParoi(); ok(proche(a.rep1, M.flux(a.dT, a.el.R)) && a.rep1 >= 80 && proche(a.rep3, a.dT / a.phiC) && a.rep3 >= a.el.R * 1.3, 'tirage paroi (Rth minimale > Rth actuelle)');
  const b = M.tirageMesure(); ok(proche(b.rep1 * b.dT / b.rep1, b.dT) && proche(b.rep3, b.dT2 / b.rep2) && b.rep2 >= 0.02, 'tirage mesure');
}
console.log(`${n} contrôles OK`);
