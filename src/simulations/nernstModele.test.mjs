// Test du modèle de la sim 292 : node src/simulations/nernstModele.test.mjs
import * as M from './nernstModele.js';
let n = 0;
const ok = (c, msg) => { n++; if (!c) { console.error('ÉCHEC :', msg); process.exit(1); } };
const proche = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, `${msg} : ${a} ≠ ${b}`);
const cu = M.COUPLES.cu, zn = M.COUPLES.zn, fe = M.COUPLES.fe, mn = M.COUPLES.mn, ag = M.COUPLES.ag;
// conditions standards : E = E°
proche(M.potentiel(cu, 1), 0.34, 1e-12, 'Cu standard'); proche(M.potentiel(zn, 1), -0.76, 1e-12, 'Zn standard');
proche(M.potentiel(fe, 1, 1), 0.77, 1e-12, 'Fe rapport 1 → E°'); proche(M.potentiel(mn, 1, 1, 0), 1.51, 1e-12, 'MnO4 standard');
// exemple de la fiche : 0,1 mol/L → 0,31 V ; −0,79 V pour le zinc
proche(M.potentiel(cu, 0.1), 0.31, 1e-9, 'fiche Cu 0,1'); proche(M.potentiel(zn, 0.1), -0.79, 1e-9, 'fiche Zn 0,1');
// parcours
proche(M.potentiel(cu, M.C_PREDIRE), 0.28, 1e-9, 'Cu 0,010 → 0,28 V'); ok(M.potentiel(cu, M.C_NERNST).toFixed(2) === '0.27', 'Cu 5,0e-3 → 0,27 V');
proche(M.potentiel(fe, M.FE_OX, M.FE_RED), 0.83, 1e-9, 'Fe 0,10 / 0,010 → 0,83 V');
proche(M.potentiel(mn, M.MN_OX, M.MN_RED, M.MN_PH), 1.51 - 0.096, 1e-9, 'MnO4 pH 1 → 1,414 V');
// pentes
proche(M.penteDecade(cu), 0.03, 1e-12, 'pente Cu'); proche(M.penteDecade(ag), 0.06, 1e-12, 'pente Ag'); proche(M.penteDecade(mn), 0.012, 1e-12, 'pente MnO4/décade');
proche(M.penteParPH(mn), -0.096, 1e-12, 'pente pH');
// une décade de [Ox] ajoute 0,06/n ; une de [Red] retranche
for (const id of M.ORDRE_COUPLES) { const c = M.COUPLES[id]; proche(M.potentiel(c, 1, 0.01) - M.potentiel(c, 1, 0.1), id === 'cu' || id === 'zn' || id === 'ag' ? 0 : 0.06 / c.n, 1e-9, 'décade ' + id); }
proche(M.potentiel(fe, 1, 0.1) - M.potentiel(fe, 1, 1), 0.06, 1e-12, 'Red ÷10 → +0,06');
// monotonie : E augmente avec [Ox]
for (const id of M.ORDRE_COUPLES) { const c = M.COUPLES[id]; ok(M.potentiel(c, 0.1, 0.01, 1) > M.potentiel(c, 0.01, 0.01, 1), 'E croît avec [Ox] ' + id); }
// points colorés
ok(M.nbPoints(1e-3) === 1 && M.nbPoints(1) === 6 && M.nbPoints(0.03) >= 2, 'nbPoints');
for (let c = 1e-3; c <= 1; c *= 1.3) { const k = M.nbPoints(c); ok(k >= 1 && k <= 6, 'nbPoints borné'); }
// droite du parcours : pente 0,03
const pts = M.pointsDroite(cu); proche((pts[0].E - pts[3].E) / (pts[0].logc - pts[3].logc), 0.03, 1e-9, 'pente de la droite');
// défis : 3000 tirages
let pire = 0;
for (let k = 0; k < 3000; k++) {
  const d = M.tirageDefiCalcul(), c = M.COUPLES[d.id]; ok(isFinite(d.E) && d.cOx > 0 && d.cRed > 0, 'tirage calcul'); 
  // un élève qui arrondit le logarithme à 2 chiffres puis E à 2 décimales reste à moins de 0,01 V
  const q = M.quotient(c, d.cOx, d.cRed, d.pH), L = Math.round(M.log10(q) * 100) / 100, E = c.E0 + 0.06 / c.n * L; pire = Math.max(pire, Math.abs(E - d.E)); ok(Math.abs(E - d.E) < 0.005, 'arrondi du log');
  if (d.id === 'fe') ok(d.cOx !== d.cRed, 'Fe : rapport ≠ 1');
  const x = M.tirageDefiInconnue(), cx = M.COUPLES[x.id], lue = M.concDepuisE(cx, x.Emes); ok(Math.abs(lue / x.c - 1) < 0.045, `lecture au mV (${x.id}) : ${lue} vs ${x.c}`);
  // avec 0,059 au lieu de 0,06 : l'écart reste < 15 %
  const lue59 = Math.pow(10, (x.Emes - cx.E0) * cx.n / 0.059); ok(Math.abs(lue59 / x.c - 1) < 0.15, `0,059 : ${lue59} vs ${x.c}`);
}
console.log(`nernstModele : ${n} contrôles OK (pire écart d'arrondi du log : ${(pire * 1000).toFixed(1)} mV)`);
