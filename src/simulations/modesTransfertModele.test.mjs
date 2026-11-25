import * as M from './modesTransfertModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.log('ÉCHEC', msg); process.exitCode = 1; } };
ok(M.MODES.every(m => M.RAISON[m.id]), 'raisons');
ok(M.SITUATIONS.every(s => M.mode(s.mode) && s.scene && s.de && s.vers), 'situations');
ok(new Set(M.SITUATIONS.map(s => s.id)).size === M.SITUATIONS.length, 'ids uniques');
for (const m of M.MODES) ok(M.SITUATIONS.filter(s => s.mode === m.id).length >= 2, 'au moins 2 situations par mode ' + m.id);
ok(Math.abs(M.PARCOURS.W + 12) < 1e-9 && Math.abs(M.PARCOURS.P - 4) < 1e-9, 'parcours');
for (let i = 0; i < 3000; i++) {
  const a = M.tirageDefiA(); ok(new Set(a.ids).size === 5 && new Set(a.ids.map(x => M.situation(x).mode)).size >= 4, 'défi A');
  const b = M.tirageDefiB(); ok(b.v0 !== b.v1 && Math.abs(b.W) > 0 && b.P > 0 && Math.sign(b.W) === Math.sign(b.v1 - b.v0), 'défi B');
}
console.log(n + ' vérifications' + (process.exitCode ? ' — ÉCHECS' : ', 0 échec'));
