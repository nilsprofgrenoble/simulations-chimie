import * as M from './microscopeModele.js';
let n = 0; const ok = (c, m) => { if (!c) { console.error('ÉCHEC :', m); process.exit(1); } n++; };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
for (const f1 of M.OBJECTIFS) for (const f2 of M.OCULAIRES) {
  const p = M.pMiseAuPoint(f1);
  ok(pr(M.posA1(p, f1), f1 + M.DELTA), `A1 en F2 (${f1})`);
  ok(pr(M.ecartF2(p, f1), 0), 'écart nul');
  ok(M.miseAuPoint(p, f1, f2), 'mise au point');
  ok(M.posA2(p, f1, f2) === Infinity, 'A2 à l’infini');
  ok(pr(M.gamma1(p, f1), -M.DELTA / f1), 'γ = −Δ/f1′');
  const AB = 0.02, A1B1 = M.tailleA1B1(AB, p, f1), th2 = M.theta2(A1B1, f2);
  ok(pr(th2 / M.theta0(AB), M.grossissement(f1, f2), 1e-9), 'G = θ2/θ0');
  ok(pr(M.grossissement(f1, f2), M.grossissementObjectif(f1) * M.grossissementOculaire(f2)), 'G = γ × Goc');
  ok(!M.miseAuPoint(p + 0.5, f1, f2), 'défocalisé');
  ok(M.posA2(p - 0.005, f1, f2) > 0 === (M.ecartF2(p - 0.005, f1) < 0), 'nature de A2');
}
// valeurs de référence utilisées dans le parcours : f1′ = 10 mm, f2′ = 25 mm, AB = 20 µm
ok(pr(M.pMiseAuPoint(10), 10.625), 'p = 10,625'); ok(pr(M.gamma1MAP(10), -16), 'γ = −16');
ok(pr(M.tailleA1B1(0.02, 10.625, 10), 0.32, 1e-6), 'A1B1 = 0,32 mm'); ok(pr(M.theta2(0.32, 25), 0.0128), 'θ2'); ok(pr(M.theta0(0.02), 8e-5), 'θ0');
ok(pr(M.grossissement(10, 25), 160), 'G = 160'); ok(!M.visibleOeilNu(0.02), '20 µm invisibles à l’œil nu'); ok(M.visibleMicroscope(0.02, 10, 25), 'visibles au microscope');
console.log(`microscopeModele : tous les tests passent (${n})`);
