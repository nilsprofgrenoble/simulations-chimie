import * as M from './xyyModele.js';
import * as C from './couleurModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const pres = (a, b, t, m) => ok(Math.abs(a - b) <= t, `${m} : ${a} ≠ ${b} (± ${t})`);
// parcours
let l = M.lecture(M.PT_LECTURE.x, M.PT_LECTURE.y);
pres(l.dominante, 590, 0.5, 'dominante du point lu'); pres(l.purete, 0.6, 1e-3, 'pureté du point lu'); ok(!l.pourpre, 'point lu non pourpre');
ok(l.dansEcran, 'le point lu est reproductible sur écran');
const dW = Math.hypot(M.PT_LECTURE.x - M.W.x, M.PT_LECTURE.y - M.W.y), dD = Math.hypot(C.pointLieu(590).x - M.W.x, C.pointLieu(590).y - M.W.y);
pres(dW, 0.167, 2e-3, 'WP'); pres(dD, 0.279, 2e-3, 'WD'); pres(0.17 / 0.28, 0.6, 0.01, 'pureté arrondie');
l = M.lecture(M.PT_POURPRE.x, M.PT_POURPRE.y); ok(l.pourpre && l.dominante == null, 'pourpre'); pres(l.complementaire, 540, 0.6, 'complémentaire du pourpre');
// paire de complémentaires : 600 nm et ≈ 490 nm, mélange blanc pour une part w
const P1 = C.pointLieu(M.PAIRE.lam1), P2 = C.pointLieu(M.PAIRE.lam2), w = M.partBlanc(P1, P2);
pres(M.PAIRE.lam2, 490, 1, 'complémentaire de 600 nm'); ok(w > 0.3 && w < 0.7, 'part du blanc plausible ' + w);
const m = C.melange(P1, P2, w); pres(m.x, M.W.x, 2e-3, 'x du mélange = blanc'); pres(m.y, M.W.y, 2e-3, 'y du mélange = blanc');
ok(Math.abs(Math.round(w * 100) / 100 - w) < 0.006, 'part du blanc atteignable au curseur 0,01');
// mélange rouge + vert sRGB à parts égales
const mel = C.melange(M.P.R, M.P.G, 0.5); pres(mel.x, 0.47, 1e-9, 'x rouge + vert'); pres(mel.y, 0.465, 1e-9, 'y rouge + vert');
// triangle sRGB : primaires dedans, 520 nm dehors
ok(C.dansTriangle(M.P.R, M.P) && !C.dansTriangle(C.pointLieu(520), M.P) && C.dansTriangle(M.W, M.P), 'triangle');
// tirages
let s = 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
let nbP = 0, nbR = 0, nbN = 0;
for (let k = 0; k < 400; k++) {
  const d = M.tirageDominante(rnd), r = M.lecture(d.pt.x, d.pt.y);
  pres(r.dominante, d.lam, 0.6, `dominante tirée ${d.lam}`); pres(r.purete, d.pur, 1e-3, 'pureté tirée'); ok(r.dansDiagramme, 'point dans le diagramme');
  const t = M.tirageNature(rnd), q = M.lecture(t.pt.x, t.pt.y);
  ok(t.nature === 'pourpre' ? q.pourpre : !q.pourpre, 'nature'); ok(q.dansEcran === t.repro, 'reproductible'); ok(M.marge(t.pt) >= 0.02, 'marge'); ok(q.dansDiagramme, 'tirage dans le diagramme');
  if (t.nature === 'pourpre') nbP++; if (t.repro) nbR++; else nbN++;
}
ok(nbP > 80 && nbP < 260, 'pourpres présents ' + nbP); ok(nbR > 80 && nbN > 80, `reproductible oui/non équilibré ${nbR}/${nbN}`);
// marge : un point du bord vaut 0, le blanc est loin du bord
pres(M.marge(M.P.R), 0, 1e-9, 'marge sommet'); ok(M.marge(M.W) > 0.05, 'marge blanc');
console.log(`xyyModele : ${n} vérifications OK (${nbP} pourpres, ${nbR} reproductibles, ${nbN} non)`);
