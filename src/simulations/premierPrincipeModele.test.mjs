// Test du modèle « premier principe » (sim 216) : node src/simulations/premierPrincipeModele.test.mjs
import * as M from './premierPrincipeModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b);
ok(proche(M.capacite(0.5, 4180), 2090), 'C = m c');
ok(M.variationU(150, 600) === 750 && M.variationU(-150, 600) === 450, 'ΔU = W + Q');
ok(proche(M.variationT(M.variationU(0, 31350), M.capacite(0.5, 4180)), 15), 'eau 0,5 kg : 31 350 J → +15 K');
ok(proche(M.temperatureFinale(20, 36000, M.capacite(0.4, 4180)), 20 + 36000 / 1672), 'Tf');
ok(proche(M.energieNecessaire(2090, 20, 35), 31350), 'Q pour 15 K');
ok(M.chaleurPuissance(300, 120) === 36000, 'P × t');
ok(M.dansDomaine(50) && !M.dansDomaine(100) && !M.dansDomaine(2), 'domaine');
// à même énergie, le cuivre s'échauffe plus que l'eau (c plus petite)
ok(M.variationT(1000, M.capacite(1, 385)) > M.variationT(1000, M.capacite(1, 4180)) * 10, 'cuivre vs eau');
for (let k = 0; k < 2000; k++) {
  const a = M.tirageChauffer(); ok(proche(a.rep1, a.m * a.mat.c) && proche(a.rep2 * 1000, a.P * a.tmin * 60) && a.rep3 > a.Ti && a.rep3 <= 90, 'tirage chauffer');
  const b = M.tirageBilan(); ok(proche(b.rep1, b.W + b.Q) && Math.abs(b.rep1) >= 1500 && b.rep3 > 0 && Math.abs(b.rep2) >= 2 && Math.abs(b.rep2) <= 40, 'tirage bilan');
}
console.log(`${n} contrôles OK`);
