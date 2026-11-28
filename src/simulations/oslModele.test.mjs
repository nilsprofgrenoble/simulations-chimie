import * as M from './oslModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const proche = (a, b, e = 1e-6) => Math.abs(a - b) <= e * Math.max(1, Math.abs(b));
// régimes
ok(M.regime(0) === 'periodique' && M.regime(0.3) === 'pseudo' && M.regime(1) === 'critique' && M.regime(1.01) === 'critique' && M.regime(1.5) === 'aperiodique', 'régimes');
// valeurs initiales et continuité de la position et de la vitesse en t = 0
for (const f0 of [0.5, 0.8, 1, 1.25, 2]) for (const z of [0, 0.05, 0.3, 0.7, 0.99, 1, 1.02, 1.1, 1.5, 3]) {
  ok(proche(M.pos(0, 1, f0, z), 1), `x(0)=x0 f0=${f0} z=${z}`);
  const h = 1e-6; ok(Math.abs((M.pos(h, 1, f0, z) - M.pos(0, 1, f0, z)) / h) < 1e-3, `v(0)=0 f0=${f0} z=${z}`);
  for (let t = 0; t < 20; t += 0.01) { const x = M.pos(t, 1, f0, z); ok(Number.isFinite(x) && Math.abs(x) <= 1.0000001, `borné f0=${f0} z=${z} t=${t}`); }
  // équation différentielle vérifiée par différences finies
  const w0 = M.omega0(f0), ze = M.zetaEff(z);
  for (const t of [0.3, 0.9, 2.1]) { const e = 1e-4, x = M.pos(t, 1, f0, z), xp = M.pos(t + e, 1, f0, z), xm = M.pos(t - e, 1, f0, z);
    const a = (xp - 2 * x + xm) / (e * e), v = (xp - xm) / (2 * e); ok(Math.abs(a + 2 * ze * w0 * v + w0 * w0 * x) < 0.05 * w0 * w0, `équation f0=${f0} z=${z} t=${t}`); }
}
// pseudopériode et temps caractéristique
ok(proche(M.pseudoPeriode(1, 0), 1) && proche(M.pseudoPeriode(2, 0.6), 1 / (2 * 0.8)), 'pseudopériode');
ok(Number.isNaN(M.pseudoPeriode(1, 1.2)) && Number.isNaN(M.tauAmort(1, 0)), 'NaN hors domaine');
ok(proche(M.tauAmort(1, 0.1), 1 / (0.1 * 2 * Math.PI)), 'tau');
// l'enveloppe majore la courbe et passe à 1/e à t = tau
for (const z of [0.05, 0.2, 0.5]) { const tau = M.tauAmort(1, z); ok(proche(M.enveloppe(tau, 1, 1, z), Math.exp(-1)), 'env tau');
  for (let t = 0; t < 12; t += 0.01) ok(Math.abs(M.pos(t, 1, 1, z)) <= M.enveloppe(t, 1, 1, z) * 1.5 + 1e-9, 'enveloppe majore'); }
// mesure de la pseudopériode : deux maxima successifs (ζ faible)
for (const z of [0.04, 0.08]) { let maxs = []; let prev = 1, prev2 = 1, t0 = 0; for (let t = 0.001; t < 5; t += 0.001) { const x = M.pos(t, 1, 1, z); if (prev > prev2 && prev > x && t > 0.1) maxs.push(t - 0.001); prev2 = prev; prev = x; t0 = t; }
  ok(maxs.length >= 3 && Math.abs((maxs[1] - maxs[0]) - M.pseudoPeriode(1, z)) < 0.003, 'pseudopériode mesurée ' + z + ' ' + maxs); void t0; }
// pas de passage par l'équilibre en régimes critique et apériodique ; au moins un en pseudopériodique
for (const z of [1, 1.3, 2, 3]) ok(M.nbPassages(1, 1, z, 20) === 0, 'sans oscillation ' + z);
ok(M.nbPassages(1, 1, 0.3, 10) >= 15, 'oscille');
// le critique revient le plus vite (à 5 %) parmi les régimes sans oscillation et plus vite que l'apériodique
for (const f0 of [0.8, 1, 1.25]) { const tc = M.tempsRetour(1, f0, 1), ta = M.tempsRetour(1, f0, 2), ta2 = M.tempsRetour(1, f0, 3); ok(tc < ta && tc < ta2, 'critique plus rapide ' + f0); }
// défis
for (let i = 0; i < 3000; i++) {
  const d = M.tirageRegime(); ok(d.cands.length === 3 && d.cands[d.bonne].r === 'critique' && new Set(d.cands.map(c => c.r)).size === 3, 'tirage régime');
  const tc = M.tempsRetour(1, d.f0, 1), tp = d.cands.find(c => c.r === 'aperiodique').zeta; ok(tc < M.tempsRetour(1, d.f0, tp), 'critique plus rapide dans le tirage');
  ok(M.nbPassages(1, d.f0, d.cands.find(c => c.r === 'pseudo').zeta, d.tFin) >= 1, 'la courbe pseudo oscille');
  ok(M.diagRegime(d, d.bonne).ok && d.cands.every((c, k) => k === d.bonne || !M.diagRegime(d, k).ok), 'diag régime');
}
for (let i = 0; i < 3000; i++) {
  const d = M.tiragePeriode(); ok(d.Tp > d.T0 && d.tFin >= 4 * d.Tp && d.tFin <= 15, 'tirage période');
  ok(M.diagPeriode(d, String(d.Tp).replace('.', ',')).ok, 'valeur exacte acceptée');
  // lecture imprécise : durée de N oscillations lue à ±0,2 s près (une graduation = 0,5 s)
  for (const N of [3, 4]) for (const err of [-0.2, 0, 0.2]) { const lu = (N * d.Tp + err) / N; ok(M.diagPeriode(d, lu.toFixed(2).replace('.', ',')).ok, `lecture imprécise N=${N} err=${err} Tp=${d.Tp} lu=${lu}`); }
  ok(!M.diagPeriode(d, String(1 / d.Tp)).ok && /fréquence/.test(M.diagPeriode(d, (1 / d.Tp).toFixed(2)).msg), 'fréquence donnée à la place');
  ok(!M.diagPeriode(d, '').ok && !M.diagPeriode(d, 'abc').ok && !M.diagPeriode(d, '-1').ok, 'saisies invalides');
}
console.log(`oslModele OK (${n} vérifications)`);
