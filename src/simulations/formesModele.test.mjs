import * as M from './formesModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.log('ÉCHEC', msg); process.exitCode = 1; } };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
for (const m of [0.2, 0.5, 1, 2]) for (const H of [1, 2, 3]) for (const p of M.PAS) {
  const e = M.etat('chute', p, { m, H });
  ok(pr(M.total(e), m * M.G * H), 'chute Etot');
  ok(pr(e.dEc + e.dEp + e.dU, 0), 'chute ΔEtot');
  ok(pr(M.ec(m, e.v), e.Ec), 'chute Ec = ½mv²');
}
for (const m of [1, 2, 3, 4]) for (const v0 of [2, 3, 4, 5, 6]) for (const p of M.PAS) {
  const e = M.etat('glisse', p, { m, v0 });
  ok(pr(M.total(e), M.ec(m, v0)), 'glisse Etot'); ok(pr(e.dEc + e.dEp + e.dU, 0), 'glisse ΔEtot'); ok(e.dU >= -1e-12, 'ΔU ≥ 0');
  if (p === 1) ok(pr(e.Ec, 0), 'arrêt');
}
for (const p of M.PAS) { const e = M.etat('chauffe', p, { m: 0.2, Q: 800 }); ok(pr(e.dEc + e.dEp + e.dU, e.recu), 'chauffe ΔEtot = reçu'); }
ok(pr(M.PARCOURS.Ec0, 9), 'Ec0'); ok(pr(M.PARCOURS.dUfrot, 8), 'dU frot'); ok(pr(M.PARCOURS.Ep0, 9.8), 'Ep0'); ok(pr(M.PARCOURS.dEpMi, -4.9), 'ΔEp mi');
for (let i = 0; i < 2000; i++) {
  const a = M.tirageDefiA(); ok(a.v1 < a.v0 && a.dU > 0 && pr(a.Ec0, 0.5 * a.m * a.v0 ** 2), 'défi A');
  const b = M.tirageDefiB(); ok(b.Ec > 0 && b.Ep1 > 0 && pr(0.5 * b.m * b.v ** 2, b.Ec), 'défi B');
}
console.log(n + ' vérifications' + (process.exitCode ? ' — ÉCHECS' : ', 0 échec'));
