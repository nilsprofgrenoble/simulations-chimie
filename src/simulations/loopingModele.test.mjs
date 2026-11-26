import * as M from './loopingModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exitCode = 1; } };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
const P = M.PARCOURS; ok(rel(P.vBas, Math.sqrt(196)) < 1e-12 && Math.abs(P.vBas - 14) < 1e-9, 'v bas'); ok(Math.abs(P.vTop - 8.85) < 0.01, 'v sommet'); ok(Math.abs(P.vMi - 11.72) < 0.01, 'v mi'); ok(Math.abs(P.vMin - 5.42) < 0.01, 'v min');
for (const R of [2, 3, 5]) { const H = M.hauteurMin(R); ok(rel(M.vitesseSans(H, 2 * R), M.vitesseMin(R)) < 1e-12, 'Hmin donne vmin'); ok(M.profil({ m: 200, H: H + 0.01, R, f: 0 }).contact, 'contact juste au-dessus'); ok(!M.profil({ m: 200, H: H - 0.1, R, f: 0 }).contact, 'décroche en dessous'); }
for (const m of [100, 500]) for (const H of [8, 12]) for (const R of [2, 3]) { const a = M.profil({ m, H, R, f: 0 }), b = M.profil({ m: 3 * m, H, R, f: 0 }); ok(rel(a.vTop, b.vTop) < 1e-9, 'v indépendante de m'); ok(a.pts.every(q => rel(q.Em, m * M.G * H) < 1e-9), 'Em conservée'); if (H > 2.6 * R) ok(rel(a.vTop, M.vitesseSans(H, 2 * R)) < 1e-9, 'v sommet'); }
for (let i = 0; i < 400; i++) { const a = M.tirageDefiA(); ok(isFinite(a.v) && a.v >= M.vitesseMin(a.R), 'A'); const b = M.tirageDefiB(); ok(b.Hmin > 4 && b.Hmin <= 15, 'B'); }
console.log(`${n} vérifications, ${process.exitCode ? 'ÉCHECS' : '0 échec'}`);
