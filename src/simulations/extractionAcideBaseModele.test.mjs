import * as M from './extractionAcideBaseModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; if (ko < 15) console.log('ÉCHEC', m); } };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const tous = [...Object.values(M.ESPECES), M.NEUTRE];
for (const e of tous) for (let pH = 0; pH <= 14.001; pH += 0.1) {
  const a = M.alpha(e, pH), D = M.distribution(e, pH);
  ok(a > 0 && a <= 1, `alpha ${e.id} ${pH}`); ok(pr(D, e.K * a), 'D'); ok(D <= e.K + 1e-9, 'D<=K');
  if (e.type !== 'neutre') { ok(pr(a, 1 / (1 + M.rapportIon(e, pH))), `alpha et rapport ${e.id}`); ok(pr(1 - a, a * M.rapportIon(e, pH)), 'ion = rapport × neutre'); if (pH > 0.05) ok(e.type === 'acide' ? a <= M.alpha(e, pH - 0.1) + 1e-12 : a >= M.alpha(e, pH - 0.1) - 1e-12, 'monotonie'); }
  for (const r of M.RATIOS) { const E = M.fractionExtraite(D, r); ok(E > 0 && E < 1, 'E'); ok(pr(E + M.fractionAq(D, r), 1), 'E + aq = 1'); for (const k of [1, 2, 3]) { ok(pr(M.resteApres(D, r, k), M.fractionAq(D, r) ** k), 'reste'); ok(M.resteApres(D, r, k + 1) < M.resteApres(D, r, k), 'reste décroît'); } }
}
for (const e of Object.values(M.ESPECES)) { ok(pr(M.alpha(e, e.pKa), 0.5), 'alpha(pKa)=1/2'); ok(pr(M.distribution(e, e.pKa), e.K / 2), 'D(pKa)=K/2');
  for (const E of [0.5, 0.9, 0.95, 0.99]) for (const r of M.RATIOS) { const p = M.pHPourExtraction(e, E, r); if (p !== null) { ok(pr(M.fractionExtraite(M.distribution(e, p), r), E, 1e-6), `pHPourExtraction ${e.id} ${E} ${r}`); } else ok(e.K * r <= E / (1 - E) + 1e-9, 'pas atteignable'); } }
// symétrie acide / base : une base de pKa p à pH = 14 − x se comporte comme un acide de même pKa à pH = x … (même formule en miroir)
ok(pr(M.alpha({ type: 'base', pKa: 5 }, 8), M.alpha({ type: 'acide', pKa: 5 }, 2)), 'miroir base/acide');
// valeurs de référence du parcours
const b = M.ESPECES.benz, a = M.alpha(b, 3.2), D = M.distribution(b, 3.2);
ok(pr(a, 0.9091, 1e-3), 'alpha 3,2'); ok(pr(D, 18.18, 1e-3), 'D 3,2'); ok(pr(100 * M.fractionExtraite(D, 1), 94.79, 1e-3), 'E 3,2'); ok(pr(100 * M.resteApres(D, 1, 2), 0.2712, 2e-3), 'reste 2');
ok(pr(M.PARCOURS.Corg / M.PARCOURS.Caq, 20), 'K du parcours');
ok(M.alpha(b, 12) < 1e-7, 'A- à pH 12'); ok(M.alpha(M.ESPECES.aniline, 10) > 0.999, 'B à pH 10'); ok(M.alpha(M.ESPECES.aniline, 1) < 1e-3, 'BH+ à pH 1');
// tirages
for (let k = 0; k < 20000; k++) {
  const t = M.tirageExtraction(), u = M.tiragePasses();
  ok(t.D > 0.2 && t.D <= t.e.K, `tirage D ${t.D}`); ok(t.E > 10 && t.E < 100, `E ${t.E}`); ok(t.pH >= 1 && t.pH <= 14, 'pH tirage');
  ok(u.D > 0.9 && u.reste > 0 && u.reste < u.unique, `reste ${u.reste} ${u.unique}`); ok(u.reste < 60, 'reste raisonnable');
}
console.log(`${n} vérifications, ${ko} échec(s).`);
process.exit(ko ? 1 : 0);
