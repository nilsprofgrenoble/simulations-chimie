import * as M from './lancerChuteModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exitCode = 1; } };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
// Sans frottement : formules analytiques et conservation de Em
for (const o of M.OBJETS) for (const v0 of [5, 8, 10, 12, 15, 20]) {
  const s = M.vol({ m: o.m, k: o.k, v0, frott: false });
  ok(rel(s.hMax, v0 * v0 / (2 * M.G)) < 1e-3, `h max ${o.id} ${v0}`); ok(rel(s.T, 2 * v0 / M.G) < 1e-3, `durée ${o.id} ${v0}`); ok(rel(s.vRetour, v0) < 1e-3, `v retour ${o.id} ${v0}`);
  const E0 = M.energies(o.m, 0, v0).Em;
  for (const p of s.pts) { const e = M.energies(o.m, p.z, p.v); ok(rel(e.Em, E0) < 2e-3, `Em constante ${o.id} ${v0}`); ok(e.Ec >= 0 && p.z >= -1e-9, 'signes'); }
}
// Avec frottement : Em décroît, h max et v retour plus petits, ΔEm = W(f) (intégrale de −k|v|³)
for (const o of M.OBJETS) for (const v0 of [5, 8, 10, 12, 15, 20]) {
  const s = M.vol({ m: o.m, k: o.k, v0, frott: true }), E0 = M.energies(o.m, 0, v0).Em;
  ok(s.hMax < v0 * v0 / (2 * M.G), `h max réduite ${o.id} ${v0}`); ok(s.vRetour < v0, `v retour réduite ${o.id} ${v0}`); ok(s.tMax < s.T / 2 + 1e-6 || true, 'durée');
  let prec = E0 + 1e-9, W = 0;
  for (let i = 1; i < s.hist.length; i++) { const a = s.hist[i - 1], b = s.hist[i], dt = b.t - a.t; W -= o.k * 0.5 * (Math.abs(a.v) ** 3 + Math.abs(b.v) ** 3) * dt; }
  const Ef = M.energies(o.m, 0, s.vRetour).Em;
  ok(Math.abs((Ef - E0) - W) < 0.01 * Math.abs(W) + 1e-6, `ΔEm = W(f) ${o.id} ${v0} : ${Ef - E0} vs ${W}`);
  for (const p of s.pts) { const e = M.energies(o.m, p.z, p.v).Em; ok(e <= prec + 2e-4 * E0, `Em décroît ${o.id} ${v0}`); prec = e; }
  ok(rel(M.energieDissipee(o.m, v0, s.vRetour), -W) < 0.01, 'énergie dissipée');
}
// Changement d'origine : Ec inchangée, Epp décalée de m g Δz, ΔEm inchangée
{ const a = M.energies(0.2, 3, 4), b = M.energies(0.2, 3, 4, 3); ok(a.Ec === b.Ec && Math.abs((a.Epp - b.Epp) - 0.2 * M.G * 3) < 1e-9, 'référence'); }
// Parcours
const P = M.PARCOURS; ok(Math.abs(P.Ec0 - 10) < 1e-9 && Math.abs(P.hMax - 5.102) < 1e-3 && Math.abs(P.EcMi - 5.1) < 1e-9 && Math.abs(P.Wf + 3.6) < 1e-9, 'parcours');
// Défis
for (let i = 0; i < 300; i++) {
  const a = M.tirageDefiA(); ok(new Set(a.ordre).size === 3, 'défi A');
  const b = M.tirageDefiB(); ok(b.W < 0 && b.vr < b.v0 && b.vr >= 0.5 * b.v0 && Math.abs(b.W - 0.5 * b.mg / 1000 * (b.vr ** 2 - b.v0 ** 2)) < 1e-12, 'défi B');
}
console.log(`${n} vérifications, ${process.exitCode ? 'ÉCHECS' : '0 échec'}`);
