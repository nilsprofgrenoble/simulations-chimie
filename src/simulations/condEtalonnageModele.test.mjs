import * as M from './condEtalonnageModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, t = 1e-6) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const sig = (x, k) => Number(Number(x).toPrecision(k));

// constantes de cellule : k = L / S (L en cm, S en cm², k en m⁻¹)
ok(proche(M.kDe(M.CELLULES.A), 80) && proche(M.kDe(M.CELLULES.B), 100) && proche(M.kDe(M.CELLULES.C), 150) && proche(M.kDe(M.CELLULES.D), 50), 'constantes de cellule');
// G = σ / k : même solution, plaques plus éloignées → G plus petite ; même cellule, solution plus concentrée → G plus grande
ok(M.conductance('nacl', 5, 80) > M.conductance('nacl', 5, 100), 'G diminue quand k augmente');
ok(M.conductance('nacl', 4, 80) < M.conductance('nacl', 6, 80), 'G augmente avec c');
ok(proche(M.conductance('nacl', 5, 80) * 80, M.sigmaSolution('nacl', 5)), 'σ = k × G');
// loi de Kohlrausch : σ = Σ λ c (NaCl : 12,6 × 10 = 126 mS/m à 10 mmol/L), écart < 2,1 % dans le domaine de validité
ok(proche(M.sigmaIdeale('nacl', 10), 126), 'Kohlrausch NaCl'); ok(proche(M.sommeLambda('hcl'), 42.6), 'HCl');
for (const id of M.ORDRE_SOLUTES) for (let c = 0.5; c <= 10; c += 0.5) ok(1 - M.sigmaSolution(id, c) / M.sigmaIdeale(id, c) <= 0.0201, 'écart dans le domaine ' + id + c);
// hors domaine : l'écart augmente (10 % à 50 mmol/L, 20 % à 100 mmol/L) et σ reste positive jusqu'à 200 mmol/L
ok(proche(1 - M.facteurInter(50), 0.10) && proche(1 - M.facteurInter(100), 0.20) && M.facteurInter(200) > 0, 'écart hors domaine');
// parcours guidé : étalon KCl 0,0100 mol/L (141 mS/m) avec la cellule A (k = 80 m⁻¹)
ok(M.gEtalon(M.ETALON_GUIDE, M.K_GUIDE) === 1.76 && Math.abs(141 / 1.76 - 80.1) < 0.05, 'étalonnage de la cellule');
const pts = M.pointsEtalonnage('nacl', M.K_GUIDE, M.STD);
ok(pts.map(p => p.G).join(' ') === '0.314 0.625 0.934 1.24 1.54', 'conductances des étalons ' + pts.map(p => p.G));
const a = M.pente(pts); ok(Math.abs(a - 0.155) < 0.0005, 'pente ' + a);
ok(Math.abs(a - M.penteTheorique('nacl', M.K_GUIDE)) / M.penteTheorique('nacl', M.K_GUIDE) < 0.02, 'pente / Σλ / k');
const Gp = M.gAffichee('nacl', M.C_INCONNUE, M.K_GUIDE); ok(Gp === 0.78, "G' " + Gp);
ok(Math.abs(80 * Gp - 62.4) < 1e-9 && Math.abs(62.4 / 12.6 - 4.95) < 0.005, 'Kohlrausch sur S′'); ok(Math.abs(Gp / 0.155 - 5.03) < 0.01, 'lecture sur la droite');
ok(proche(M.FACTEUR_DILUTION * 5.0, 100), 'dilution');
// la droite calculée avec les points ≤ 10 mmol/L ignore les points hors domaine
const ptsEt = M.pointsEtalonnage('nacl', M.K_GUIDE, [...M.STD, ...M.STD_ETENDUS]);
ok(proche(M.pente(ptsEt), a) && ptsEt.filter(p => p.hors).length === 3, 'points hors domaine ignorés');
// au-delà du domaine, G est inférieure à la droite (écart > 9 % à 50 mmol/L)
{ const p50 = ptsEt.find(p => p.c === 50); ok(p50.G < 0.92 * a * 50 && p50.G > 0.85 * a * 50, 'écart à 50 mmol/L'); }
// solutés : la pente dépend du soluté et de la cellule
ok(M.penteTheorique('hcl', 80) > 3 * M.penteTheorique('ch3coona', 80) && M.penteTheorique('nacl', 150) < M.penteTheorique('nacl', 80), 'pente = Σλ / k');
// défi 1 : 5 000 tirages ; une chaîne de calculs arrondis à 2 ou 3 chiffres significatifs reste dans la marge
let pire1 = 0;
for (let i = 0; i < 5000; i++) {
  const d = M.tirageDefiCellule();
  ok(d.Get > 0 && d.GX > 0 && isFinite(d.cCalc), 'valeurs finies défi 1');
  ok(Math.abs(d.kc - d.k) / d.k < 0.01, `k retrouvé ${d.k} ${d.kc}`);
  ok(Math.abs(d.cCalc - d.c) / d.c < 0.03, `c retrouvée ${d.c} ${d.cCalc}`);
  for (const s of [2, 3]) { const kk = sig(d.et.sigma / d.Get, s), ss = sig(kk * d.GX, s), cc = sig(ss / M.sommeLambda(d.id), s);
    pire1 = Math.max(pire1, Math.abs(cc - d.cCalc) / d.cCalc); ok(Math.abs(cc - d.cCalc) / d.cCalc <= 0.06, `arrondis défi 1 (${s} CS) ${d.k} ${d.c} : ${cc} / ${d.cCalc}`); }
  ok(Math.abs(sig(d.cCalc, 2) - d.c) / d.c <= 0.06, 'résultat arrondi / valeur réelle défi 1');
}
// défi 2 : 5 000 tirages ; lecture de la pente par un élève (moindres carrés, plus grand étalon, plus petit étalon) et arrondis
let pire2 = 0;
for (let i = 0; i < 5000; i++) {
  const d = M.tirageDefiDosage();
  ok(d.pts.length === 5 && d.pts.every(p => isFinite(p.G) && p.G > 0), 'étalons défi 2');
  ok(d.Gd > d.pts[0].G && d.Gd < d.pts[4].G, 'G de S′ entre les étalons extrêmes');
  ok(d.cS >= 0.0125 && d.cS <= 0.375, 'concentration de S ' + d.cS);
  const pentes = [d.a, d.pts[4].G / d.pts[4].c, d.pts[0].G / d.pts[0].c];
  for (const a1 of pentes) for (const s of [2, 3]) { const aa = sig(a1, s), cp = sig(d.Gd / aa, s), cs = sig(d.F * cp / 1000, s);
    pire2 = Math.max(pire2, Math.abs(cs - d.cS) / d.cS); ok(Math.abs(cs - d.cS) / d.cS <= 0.10, `arrondis défi 2 (${s} CS) ${cs} / ${d.cS}`); }
}
console.log('etalonnageModele : tous les tests passent (' + n + ' + 10 000 tirages ; pire écart défi 1 : ' + (100 * pire1).toFixed(1) + ' %, défi 2 : ' + (100 * pire2).toFixed(1) + ' %)');
