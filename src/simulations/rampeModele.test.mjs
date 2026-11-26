import * as M from './rampeModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exitCode = 1; } };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
const P = M.PARCOURS; ok(rel(M.energiePot(P.m, P.h), P.Epp0) < 1e-12, 'Epp'); ok(Math.abs(M.vitesseSans(P.h) - 9.9) < 0.01, 'v sans'); ok(rel(M.energieCin(P.m, P.vR), P.EcR) < 1e-12, 'Ec retour');
ok(rel(P.EcR - P.Epp0, P.Wf) < 1e-12, 'Wf'); ok(rel(M.forceFrott({ m: P.m, h: P.h, L: P.L, vR: P.vR }), P.f) < 1e-12 && rel(-P.Wf / P.L, P.f) < 1e-12, 'f'); ok(rel(M.vitesseSans(P.h4), 2 * M.vitesseSans(P.h)) < 1e-12, 'h × 4 : v × 2');
for (const m of [1, 2, 5]) for (const h of [2, 5, 10]) for (const L of [h * 1.2, 2 * h, 5 * h]) for (const f of [0, 0.5, 2]) {
  const pr = M.profil({ m, h, L, f }); if (!pr.glisse) { ok(m * M.G * h / L <= f, 'glisse'); continue; }
  ok(rel(pr.pts.at(-1).Ec, m * M.G * h - f * L) < 1e-9 || pr.pts.at(-1).Ec === 0, 'Ec finale'); ok(pr.pts.every(q => Math.abs(q.Em - (m * M.G * h - f * q.s)) < 1e-9 || q.Ec === 0), 'Em = mgh − f s');
  if (f === 0) ok(rel(pr.pts.at(-1).v, M.vitesseSans(h)) < 1e-9, 'v indépendante de m, L');
}
for (let i = 0; i < 400; i++) { const a = M.tirageDefiA(); ok(rel(a.v, M.vitesseSans(a.h)) < 1e-12, 'A'); const b = M.tirageDefiB(); ok(b.f > 0 && isFinite(b.vR) && b.vR < b.vs, 'B'); }
console.log(`${n} vérifications, ${process.exitCode ? 'ÉCHECS' : '0 échec'}`);
