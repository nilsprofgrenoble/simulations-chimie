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
// blanc de référence : D65 = W ; A et F2 déplacent le blanc, et la lecture avec w est cohérente
const wA = M.blancIll('A'), wF = M.blancIll('F2');
pres(M.blancIll('D65').x, M.W.x, 1e-9, 'D65 = W'); pres(wA.x, 0.4476, 1e-3, 'x de A'); pres(wA.y, 0.4075, 1e-3, 'y de A'); pres(wF.x, 0.3881, 1e-3, 'x de F2');
for (const id of ['D65', 'A', 'F2']) { const w = M.blancIll(id); ok(C.dansDiagramme(w.x, w.y), 'blanc ' + id + ' dans le diagramme');
  const r = M.lecture(w.x + 1e-3, w.y + 1e-3, w); ok(r.purete < 0.05, 'pureté ~ 0 au blanc ' + id);
  const p = C.pointDeDominante(500, 0.5, w), q = M.lecture(p.x, p.y, w); pres(q.dominante, 500, 0.6, 'dominante sous ' + id); pres(q.purete, 0.5, 1e-3, 'pureté sous ' + id); }
// le point du parcours (590 nm, 0,60 sous D65) devient un pourpre sous A ; un bleu (480 nm) garde sa dominante mais gagne en pureté
const lA = M.lecture(M.PT_LECTURE.x, M.PT_LECTURE.y, wA); ok(lA.pourpre && lA.purete < 0.2, 'point du parcours : pourpre sous A'); pres(lA.complementaire, 514, 1, 'complémentaire sous A');
const bleu = C.pointDeDominante(480, 0.6), bA = M.lecture(bleu.x, bleu.y, wA); ok(!bA.pourpre, 'bleu non pourpre sous A'); pres(bA.dominante, 481, 1, 'bleu : dominante sous A'); pres(bA.purete, 0.74, 0.01, 'bleu : pureté sous A');
// adaptation de Bradford : le blanc source devient le blanc d'affichage ; identité si les blancs sont les mêmes
for (const id of ['A', 'F2']) { const w = M.blancIll(id), q = M.adapter(w, w, M.W); pres(q.x, M.W.x, 1e-9, 'blanc ' + id + ' devient W x'); pres(q.y, M.W.y, 1e-9, 'blanc ' + id + ' devient W y'); }
{ const p0 = { x: 0.47, y: 0.386 }, q = M.adapter(p0, M.W, M.W); pres(q.x, p0.x, 1e-9, 'identité x'); pres(q.y, p0.y, 1e-9, 'identité y');
  const a = M.adapter(p0, wA, M.W); ok(Math.hypot(a.x - M.W.x, a.y - M.W.y) < Math.hypot(p0.x - M.W.x, p0.y - M.W.y), 'sous A, l’orange se rapproche du blanc perçu');
  const back = M.adapter(a, M.W, wA); pres(back.x, p0.x, 1e-9, 'aller-retour x'); pres(back.y, p0.y, 1e-9, 'aller-retour y'); }
console.log(`xyyModele : ${n} vérifications OK (${nbP} pourpres, ${nbR} reproductibles, ${nbN} non)`);
