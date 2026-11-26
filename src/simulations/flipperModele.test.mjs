import * as M from './flipperModele.js';
let n = 0; const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exitCode = 1; } };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-12);
const P = M.PARCOURS; ok(Math.abs(P.hVol - 0.459) < 0.001, 'h vol'); ok(Math.abs(P.vMin - 3.96) < 0.01, 'v min'); ok(Math.abs(P.L - 1.6) < 1e-9, 'L'); ok(Math.abs(P.v5 - 3.05) < 0.01, 'v5'); ok(Math.abs(P.vMinF - 4.20) < 0.01, 'v min frott');
for (const h of [0.4, 0.8, 1.2]) for (const deg of [15, 30, 60]) for (const m of [0.05, 0.2]) {
  const v = M.vitesseMinSans(h), a = M.profil({ m, h, deg, f: 0, v0: v + 0.01 }), b = M.profil({ m, h, deg, f: 0, v0: v - 0.05 });
  ok(a.arrive && !b.arrive, 'arrive au-dessus du seuil seulement'); ok(rel(M.hauteurAtteinte(v), h) < 1e-12, 'hauteur inverse');
  ok(a.pts.every(q => rel(q.Em, a.pts[0].Em) < 1e-9), 'Em conservée sans frottement');
  const f = 0.05, w = M.vitesseMinFrott({ m, h, deg, f }); ok(w >= v, 'frottement augmente'); ok(M.profil({ m, h, deg, f, v0: w + 0.01 }).arrive && !M.profil({ m, h, deg, f, v0: w - 0.02 }).arrive, 'seuil avec frottement');
  ok(rel(M.profil({ m, h, deg, f: 0, v0: v + 1 }).vHaut, M.vitesseEnHaut(v + 1, h)) < 1e-9, 'v en haut');
  ok(M.vitesseMinFrott({ m, h, deg: 60, f }) < M.vitesseMinFrott({ m, h, deg: 15, f }), 'rampe plus raide, moins de pertes');
  ok(rel(M.vitesseMinSans(h), M.vitesseMinSans(h)) === 0 && M.vitesseMinSans(h) === Math.sqrt(2 * 9.8 * h), 'indépendante de m et deg');
}
for (let i = 0; i < 500; i++) { const a = M.tirageDefiA(); ok(a.v > 2 && a.v < 5, 'A'); const b = M.tirageDefiB(); ok(b.v > b.vSans && b.v < 7, 'B ' + b.v); }
console.log(`${n} vérifications, ${process.exitCode ? 'ÉCHECS' : '0 échec'}`);
