import * as M from './freinageModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exitCode = 1; } };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
ok(rel(M.kmhEnMs(72), 20) < 1e-12 && rel(M.msEnKmh(20), 72) < 1e-12, 'conversions');
const P = M.PARCOURS; ok(rel(M.energieCin(P.m, P.v0), P.Ec0) < 1e-12 && rel(M.distanceArret({ m: P.m, v0: P.v0, F: P.F }), P.d) < 1e-12 && rel(M.distanceArret({ m: P.m, v0: P.v02, F: P.F }), P.d2) < 1e-12, 'parcours');
ok(rel(M.distanceArret({ m: P.m, v0: P.v0, F: P.F, p: P.pDesc }), P.dDesc) < 1e-12 && Math.abs(P.dDesc - 26.6) < 0.05, 'descente');
for (const m of [500, 1000, 5000]) for (const v0 of [5, 10, 20, 30]) for (const F of [2000, 8000, 16000]) for (const p of [-0.1, -0.05, 0, 0.05, 0.1]) {
  const d = M.distanceArret({ m, v0, F, p }); if (!isFinite(d)) { ok(M.forceOppo(F, m, p) <= 0, 'jamais'); continue; }
  // Théorème de l'énergie cinétique : 0 − Ec0 = W(F) + W(P) = −F d − m g p d
  ok(rel(-M.energieCin(m, v0), -F * d - m * M.G * p * d) < 1e-9, `théorème ${m} ${v0} ${F} ${p}`);
  const pr = M.profil({ m, v0, F, p }); ok(rel(pr.d, d) < 1e-12 && Math.abs(pr.pts.at(-1).Ec) < 1e-6 * M.energieCin(m, v0) + 1e-9, 'profil'); ok(pr.pts.every((q, i) => i === 0 || q.Ec <= pr.pts[i - 1].Ec + 1e-9), 'Ec décroît');
  ok(rel(M.distanceArret({ m, v0: 2 * v0, F, p: 0 }), 4 * M.distanceArret({ m, v0, F, p: 0 })) < 1e-12, 'v doublée : d × 4'); ok(rel(M.distanceArret({ m: 2 * m, v0, F, p: 0 }), 2 * M.distanceArret({ m, v0, F, p: 0 })) < 1e-12, 'm doublée : d × 2');
}
for (let i = 0; i < 400; i++) { const a = M.tirageDefiA(); ok(a.d >= 6 && a.d <= 130, 'A'); const b = M.tirageDefiB(); ok(rel(M.distanceArret({ m: b.m, v0: b.vms, F: b.F }), b.D) < 1e-9, 'B'); }
console.log(`${n} vérifications, ${process.exitCode ? 'ÉCHECS' : '0 échec'}`);
