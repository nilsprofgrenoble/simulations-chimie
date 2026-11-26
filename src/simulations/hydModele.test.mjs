import assert from 'node:assert/strict';
import * as M from './hydModele.js';
const C = M.CATS, close = (a, b, t = 0.02) => assert.ok(Math.abs(a - b) <= t, `${a} ≠ ${b}`);
// valeurs de référence calculées à la main
close(M.phDebut(C.Cr, 0.01), 4.61, 0.02); close(M.phDebut(C.Ni, 0.01), 7.10, 0.02); close(M.phDebut(C.Mn, 0.01), 8.65, 0.02); close(M.phDebut(C.Mg, 0.01), 9.47, 0.02);
close(M.phFin(C.Cr), 5.61, 0.02); close(M.phFin(C.Ni), 8.60, 0.02); close(M.phFin(C.Mn), 10.15, 0.02); close(M.phFin(C.Mg), 10.99, 0.02);
// au pH de début la fraction précipitée est nulle, au pH de fin la concentration restante vaut 1e-5
for (const k of M.ORDRE) for (const c of M.CONCS) { const cat = C[k]; close(M.fractionPrecipitee(cat, c, M.phDebut(cat, c)), 0, 1e-9); close(M.restant(cat, c, M.phFin(cat)), Math.min(c, M.C_FIN), 1e-12); assert.equal(M.statut(cat, c, M.phDebut(cat, c) - 0.5), 'dissous'); assert.equal(M.statut(cat, c, M.phFin(cat) + 0.01), 'total'); }
// fenêtres
const w1 = M.fenetre(C.Cr, 0.01, C.Ni, 0.01); assert.equal(w1.premier.id, 'Cr'); assert.equal(w1.qualite, 'nette'); close(w1.largeur, 1.49, 0.03);
const w2 = M.fenetre(C.Ni, 0.01, C.Mn, 0.01); assert.equal(w2.qualite, 'impossible');
const w3 = M.fenetre(C.Mn, 0.01, C.Mg, 0.01); assert.ok(!w3.ok);
assert.equal(M.fenetre(C.Mg, 0.01, C.Cr, 0.01).premier.id, 'Cr');
// défis
for (let i = 0; i < 800; i++) {
  const d = M.tirageDefiSeparer(); assert.ok(d.w.largeur >= 1);
  const mid = (d.w.lo + d.w.hi) / 2; assert.ok(M.diagSeparer(d, mid).ok);
  assert.ok(M.diagSeparer(d, d.w.hi + 0.6).ok === false && M.diagSeparer(d, d.w.lo - 0.6).ok === false);
  assert.ok(M.diagSeparer(d, d.w.lo - 0.6).msg.includes('ions'));
  // un pointé imprécis d'une graduation (0,1) à l'intérieur reste accepté
  assert.ok(M.diagSeparer(d, d.w.lo + 0.1).ok && M.diagSeparer(d, d.w.hi - 0.1).ok);
  const e = M.tirageDefiDebut(); assert.ok(M.diagDebut(e, Number(e.ph.toFixed(1))).ok); assert.ok(M.diagDebut(e, e.ph + 0.5).ok === false);
  assert.ok(M.diagDebut(e, 14 - e.ph).ok === false || Math.abs(14 - e.ph - e.ph) < 0.15);
}
console.log('hydModele : OK');
