// Test du modèle « Terre-atmosphère » (sim 236) : node src/simulations/terreAtmModele.test.mjs
import * as M from './terreAtmModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, tol = 1e-9) => Math.abs(a - b) <= tol * Math.abs(b);
const r2 = x => Number(x.toPrecision(2));
ok(proche(M.absorbee(1361, 0.30), 238.175), 'puissance absorbée Terre');
ok(Math.abs(M.teqDe(1361, 0.30) - 254.6) < 0.3 && Math.round(M.teqDe(1361, 0.30)) === 255, 'Teq Terre ≈ 255 K');
ok(Math.abs(M.celsius(M.teqDe(1361, 0.30)) + 18) < 0.6, 'Teq Terre ≈ −18 °C');
ok(proche(M.emise(M.tempEq(300)), 300), 'σT⁴ et racine quatrième réciproques');
ok(M.teqDe(1361, 0.25) > M.teqDe(1361, 0.30) && M.teqDe(2000, 0.3) > M.teqDe(1000, 0.3), 'moins d’albédo ou plus de flux : plus chaud');
ok(proche(M.teqDe(1361, 0.30) * 2 ** 0.25, M.tempSerre(1361, 0.30, 0.5)), 'g = 0,5 : facteur 2^(1/4)');
ok(proche(M.tempSerre(1361, 0.30, 0), M.teqDe(1361, 0.30)), 'g = 0 : sans effet de serre');
const g = M.gPour(1361, 0.30, 288); ok(g > 0.38 && g < 0.39 && proche(M.tempSerre(1361, 0.30, g), 288), 'g reproduisant 288 K');
ok(Math.abs(M.teqDe(586, 0.25) - 210) < 1.5, 'Mars : Teq proche de la température observée');
ok(M.teqDe(2601, 0.77) < 235 && M.teqDe(2601, 0.77) > 220, 'Vénus : Teq ≈ 227 K, loin de 737 K');
ok(proche(M.albedoPour(1361, 255), 1 - 4 * M.emise(255) / 1361), 'albédo pour une température');
let pire = 0;
for (let k = 0; k < 3000; k++) {
  const a = M.tiragePlanete(), b = M.tirageAlbedo();
  ok(proche(a.rep1, (1 - a.A) * a.S0 / 4) && proche(M.emise(a.rep2), a.rep1) && a.rep2 > 100 && a.rep2 < 450 && Math.abs(a.rep3 - a.rep2) >= 8, 'tirage planète');
  ok(proche(b.rep3, 1 - b.rep1 / b.rep2) && b.rep3 >= 0.12 && b.rep3 <= 0.65, 'tirage albédo');
  // tolérance sur A : l'élève qui arrondit σT⁴ et S0/4 à 2 chiffres significatifs doit rester dans ±0,03
  const Ar = 1 - r2(b.rep1) / r2(b.rep2); pire = Math.max(pire, Math.abs(Ar - b.rep3));
  ok(Math.abs(Ar - b.rep3) <= 0.03, `albédo avec valeurs arrondies : ${Ar} contre ${b.rep3}`);
  // chaîne planète : P arrondie à 2 CS puis T, tolérance 5 %
  ok(Math.abs(M.tempEq(r2(a.rep1)) - a.rep2) <= 0.05 * a.rep2, 'planète : P arrondie acceptée');
}
console.log(`${n} contrôles OK ; pire écart d'albédo avec valeurs à 2 chiffres : ${pire.toFixed(3)}`);
