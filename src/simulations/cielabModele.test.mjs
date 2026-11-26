import * as M from './cielabModele.js';
import * as C from './couleurModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pres = (a, b, e, m) => ok(Math.abs(a - b) <= e, `${m} : ${a} ≠ ${b}`);
pres(C.deltaE76(M.LOT0, M.CIBLE), 3, 1e-12, 'ΔE du lot de départ = 3');
pres(C.lch(M.CIBLE).C, 25, 1e-12, 'C* cible'); pres(C.lch(M.CIBLE).h, 286.26, 0.01, 'h cible');
const e = C.ecartCylindrique(M.LOT0, M.CIBLE); pres(e.dL, -1, 1e-12, 'ΔL'); pres(e.dC, 2.5136, 1e-3, 'ΔC'); pres(e.dH, 1.2968, 1e-3, 'ΔH');
pres(e.dL ** 2 + e.dC ** 2 + e.dH ** 2, 9, 1e-9, 'ΔE² = ΔL² + ΔC² + ΔH²');
const d0 = M.description(M.LOT0, M.CIBLE); ok(d0.lum === 'plus foncé' && d0.sat === 'plus saturé' && d0.rouge === 'plus rouge' && d0.jaune === 'plus bleu', 'description du lot de départ');
ok(M.enGamut(M.CIBLE) && M.enGamut(M.LOT0), 'cible et lot affichables');
// les deux lots de la tolérance : même ΔE*ab, CMC différent
const t = M.lotsTolerance(); pres(C.deltaE76(t.enC, M.CIBLE), 1.5, 1e-9, 'ΔE lot C'); pres(C.deltaE76(t.enH, M.CIBLE), 1.5, 0.01, 'ΔE lot H');
ok(C.deltaCMC(t.enC, M.CIBLE) < M.TOL_CMC && C.deltaCMC(t.enH, M.CIBLE) > M.TOL_CMC, 'lot C accepté, lot H refusé en CMC');
ok(C.deltaE76(t.enC, M.CIBLE) <= M.TOL_ECART && C.deltaE76(t.enH, M.CIBLE) <= M.TOL_ECART, 'les deux lots passent en ΔE*ab');
// tirages
let seed = 12345; const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
for (let k = 0; k < 400; k++) {
  const q = M.tirageEcart(rnd), e = C.deltaE76(q.lot, q.cible);
  ok(Math.abs(q.vrai - e) <= 0.05 + 1e-9 && q.conforme === (e <= q.tol) && Math.abs(e - q.tol) / q.tol >= 0.12, `tirageEcart ${k}`);
  ok(M.enGamut(q.cible) && M.enGamut(q.lot), 'gamut');
  const l = M.tirageLecture(rnd), ds = M.description(l.lot, l.cible); ok(ds.lum === l.lum && ds.sat === l.sat && Math.abs(C.ecartCylindrique(l.lot, l.cible).dC) >= 1.2, `tirageLecture ${k}`);
}
// ellipsoïde CMC : axes et maillage
{ const e = C.ellipseCMC(M.CIBLE, 1); ok(e.rC > e.rH && e.rL > 0, 'axes CMC : saturation > teinte');
  pres(e.rL, 2 * (0.040975 * 45 / (1 + 0.01765 * 45)), 1e-9, 'rL = l·SL');
  const g = C.ellipseCMC({ L: 55, a: 0, b: 0 }, 1); pres(g.rC, g.rH, 1e-9, 'gris : ellipse = cercle');
  const m = M.maillageEllipsoide(M.CIBLE, 1);
  for (let i = 0; i < m.x.length; i += 3) for (let j = 0; j < m.x[i].length; j += 5) { const pt = { L: m.z[i][j], a: m.x[i][j], b: m.y[i][j] }; pres(C.deltaCMC(pt, M.CIBLE), 1, 0.04, `point ${i},${j} sur l’ellipsoïde CMC = 1`); }
  const s = M.maillageSphere(M.CIBLE, 1.5);
  for (let i = 0; i < s.x.length; i += 3) for (let j = 0; j < s.x[i].length; j += 5) pres(C.deltaE76({ L: s.z[i][j], a: s.x[i][j], b: s.y[i][j] }, M.CIBLE), 1.5, 1e-9, 'point sur la sphère ΔE = 1,5');
  const m4 = M.maillageEllipsoide(M.CIBLE, 1, 4); pres(m4.z[0][0] - M.CIBLE.L, 4 * e.rL, 1e-9, 'agrandissement ×4 sur L*');
  ok(M.POSITIONS_ELLIPSES.length === 9, '9 positions d’ellipses'); }
console.log(`cielabModele : ${n} vérifications OK`);
