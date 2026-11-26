// node src/simulations/conductimetrieKModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './conductimetrieKModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const pres = (a, b, t, m) => { assert.ok(Math.abs(a - b) <= t * Math.abs(b), `${m} : ${a} vs ${b}`); n++; };
for (const a of Object.keys(M.ACIDES)) for (const c of M.C_LISTE) {
  const e = M.equilibre(a, c);
  pres(e.x * e.x / (c - e.x), M.Ka(a), 1e-12, `K retrouvé ${a} ${c}`);
  ok(e.x > 0 && e.x < c && e.tau > 0 && e.tau < 1, `tau borné ${a} ${c}`);
  ok(e.x * 1000 < 10, `domaine de Kohlrausch (ions < 10 mol/m³) ${a} ${c}`);
  ok(e.x * 1000 * 1e-7 > 0, 'x');
  ok(1e-14 / e.x < 1e-9, `HO⁻ négligeable ${a} ${c}`);          // [HO⁻] = Ke / [H₃O⁺] en mol/L
  pres(M.xDepuisSigma(a, M.sigma(a, c)), e.x, 1e-12, 'aller-retour σ → x');
  pres(M.Kcalcule(c, M.xDepuisSigma(a, M.sigma(a, c))), M.Ka(a), 1e-9, 'K depuis σ');
  ok(M.sigmaMesuree(a, c, 0) === M.arrondiCS(M.sigma(a, c)), 'mesure sans bruit');
  for (let g = 1; g <= 400; g++) { const s = M.sigmaMesuree(a, c, g); ok(Math.abs(s - M.sigma(a, c)) <= 0.0135 * M.sigma(a, c), `bruit ≤ 1 % + arrondi (${a} ${c} ${g})`); }
}
// K ne dépend pas de c, τ diminue quand c augmente
for (const a of Object.keys(M.ACIDES)) { let prec = 2; for (const c of M.C_LISTE) { const t = M.equilibre(a, c).tau; ok(t < prec, `τ décroît avec c (${a})`); prec = t; } }
// cas de la méthanoïque à 0,012 et 0,0030 mol/L (valeurs du parcours)
pres(M.sigma('HCOOH', 0.012), 55.5, 0.01, 'σ(HCOOH, 0,012) ≈ 55,5'); pres(M.equilibre('HCOOH', 0.012).x, 1.375e-3, 0.01, 'x(HCOOH, 0,012)');
pres(M.sigma('HCOOH', 0.0030), 26.1, 0.01, 'σ(HCOOH, 0,0030) ≈ 26,1');
ok(M.nbPaires('HCOOH', 0.012) === 7 && M.nbPaires('HCOOH', 0.0030) === 13, `paires 7 et 13 (obtenu ${M.nbPaires('HCOOH', 0.012)} et ${M.nbPaires('HCOOH', 0.0030)})`);
ok(M.nbPaires('C2H5COOH', 0.040) >= 1, 'au moins une paire');
// défis : valeurs attendues cohérentes avec σ affichée
let pire = 0;
for (let k = 0; k < 3000; k++) { const d = M.tirageDefi(); ok(d.K > 0 && isFinite(d.K) && d.tau > 0 && d.tau < 1, 'défi valide');
  pire = Math.max(pire, Math.abs(d.K - d.Ktab) / d.Ktab); }
ok(pire < 0.06, `écart K mesuré / K tabulé < 6 % (pire ${(100 * pire).toFixed(1)} %)`);
console.log(`conductimetrieKModele : ${n} contrôles OK (pire écart K défi / tabulée : ${(100 * pire).toFixed(1)} %)`);
