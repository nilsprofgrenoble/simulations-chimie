import assert from 'node:assert/strict';
import * as M from './planMelangeModele.js';

const proche = (a, b, t = 1e-6) => assert.ok(Math.abs(a - b) < t, `${a} ≠ ${b}`);

// --- formule de référence du TP : 1,088 / 0,704 / 1,408 g sur 3,2 g = 34 / 22 / 44 %
proche(M.FREF.reduce((a, b) => a + b, 0), 1);
proche(M.FREF[0], 0.34); proche(M.FREF[1], 0.22); proche(M.FREF[2], 0.44);

// --- plus grand simplexe centré : s = 3·min ; Lᵢ = xᵢ − min ; le centre du simplexe est la référence
const d = M.simplexeCentre(M.FREF);
proche(d.m, 0.22); proche(d.s, 0.66); proche(d.L[1], 0);
proche(d.L[0], 0.12); proche(d.L[2], 0.22);
d.sommets.forEach(s => { proche(s.reduce((a, b) => a + b, 0), 1); assert.ok(s.every(v => v >= -1e-12)); });
const centre = M.pseudoVersReel([1 / 3, 1 / 3, 1 / 3], d);
centre.forEach((v, i) => proche(v, M.FREF[i]));
M.reelVersPseudo(M.FREF, d).forEach(v => proche(v, 1 / 3));
// exemple du tableau : 34 / 22 / 44 % → bornes basses 12 / 0 / 22 %, côté 66 %
const t = M.simplexeCentre([0.34, 0.22, 0.44]);
proche(t.L[0], 0.12); proche(t.L[1], 0); proche(t.L[2], 0.22); proche(t.s, 0.66);
// aucun simplexe de même orientation plus grand : un côté de 3·min + ε sort du triangle
assert.ok(M.pseudoVersReel([0, 1, 0], { L: t.L, s: t.s + 0.01 })[0] + 0 >= 0);   // sommet B reste positif…
assert.ok(M.pseudoVersReel([1, 0, 0], { L: t.L.map((l, i) => M.FREF[0] ? [0.34, 0.22, 0.44][i] - (t.s + 0.03) / 3 : 0), s: t.s + 0.03 })[1] < 0);   // … mais B < 0 au-delà du maximum

// --- calcul à la main sur les 7 mesures réelles
const c = M.coefsMain(M.FERMETE);
proche(c.quadratique[3], -24); proche(c.quadratique[4], -52); proche(c.quadratique[5], -368);
proche(c.cubique[6], 27 * (348 - ((752 + 146 + 346) / 3 + (-24 - 52 - 368) / 9)));
proche(M.ecartMilieu(154, 146, 346), 154 - 246);

// --- ajustement : 6 points du réseau → quadratique exact = formules à la main ; 7 points → cubique spécial exact
const pts6 = M.PLAN7.slice(0, 6).map(p => p.z), pts7 = M.PLAN7.map(p => p.z);
const q6 = M.ajuste(pts6, M.FERMETE.slice(0, 6), 'quadratique');
q6.coefs.forEach((v, i) => proche(v, c.quadratique[i], 1e-6)); assert.equal(q6.ddl, 0); assert.equal(q6.s, null);
const cu = M.ajuste(pts7, M.FERMETE, 'cubique');
cu.coefs.forEach((v, i) => proche(v, c.cubique[i], 1e-5)); cu.residus.forEach(r => proche(r, 0, 1e-6)); assert.equal(cu.ddl, 0);
// quadratique sur 7 points : 1 degré de liberté ; la prédiction au centre (modèle exact sur les 6 points) vaut 365,3 g
const q7 = M.ajuste(pts7, M.FERMETE, 'quadratique');
assert.equal(q7.ddl, 1); assert.ok(q7.s > 0);
const cent6 = M.predit(q6.coefs, 'quadratique', [1 / 3, 1 / 3, 1 / 3]);
proche(cent6, (752 + 146 + 346) / 3 + (-24 - 52 - 368) / 9, 1e-6); assert.ok(Math.abs(cent6 - 365.3) < 0.1);
// note sensorielle : le quadratique prévoit 4,6 au centre, la mesure est 10 → le terme cubique est nécessaire
const qn = M.ajuste(pts6, M.NOTE.slice(0, 6), 'quadratique');
assert.ok(Math.abs(M.predit(qn.coefs, 'quadratique', [1 / 3, 1 / 3, 1 / 3]) - 4.556) < 0.01);
const cn = M.ajuste(pts7, M.NOTE, 'cubique'); cn.residus.forEach(rr => proche(rr, 0, 1e-6));
// linéaire : 4 degrés de liberté, R² faible (les synergies ne sont pas décrites)
const li = M.ajuste(pts7, M.FERMETE, 'lineaire');
assert.equal(li.ddl, 4); assert.ok(li.r2 < q7.r2 && q7.r2 < 1 + 1e-9);
// la somme des proportions vaut toujours 1 : un terme constant serait redondant
M.AXIAUX.concat(M.PLAN7).forEach(p => proche(p.z.reduce((a, b) => a + b, 0), 1));

// --- coordonnées ternaires (A en haut, B bas-gauche, C bas-droite)
const A = M.versXY([1, 0, 0]), B = M.versXY([0, 1, 0]), C = M.versXY([0, 0, 1]);
proche(B.px, 0); proche(B.py, 0); proche(C.px, 1); proche(A.px, 0.5); proche(A.py, Math.sqrt(3) / 2);
[[0.2, 0.3, 0.5], [0.7, 0.1, 0.2], [0.34, 0.22, 0.44]].forEach(x => { const p = M.versXY(x), r = M.versFractions(p.px, p.py); r.forEach((v, i) => proche(v, x[i])); });

// --- isoréponses : f(z) = z_A ; niveau 0,5 → droite horizontale de longueur 0,5
const seg = M.segmentsIso(z => z[0], 0.5, 40);
assert.ok(seg.length > 0);
let L = 0; seg.forEach(([a, b]) => { proche(a[0], 0.5, 1e-9); proche(b[0], 0.5, 1e-9); const p = M.versXY(a), q = M.versXY(b); L += Math.hypot(p.px - q.px, p.py - q.py); });
proche(L, 0.5, 1e-6);
assert.equal(M.segmentsIso(z => z[0], 1.5, 20).length, 0);
// courbe fermée de la forme quadratique (cercle autour du centre) : les segments se raccordent
const cercle = M.segmentsIso(z => (z[0] - 1 / 3) ** 2 + (z[1] - 1 / 3) ** 2 + (z[2] - 1 / 3) ** 2, 0.02, 60);
assert.ok(cercle.length > 20);

// --- extrêmes : modèle quadratique issu des mesures
const ex = M.extremes(z => M.predit(q6.coefs, 'quadratique', z));
assert.ok(ex.max.y >= 752 - 1e-6 && ex.max.y < 760);   // maximum au sommet A (candelilla)
assert.ok(ex.min.y <= 146 + 1e-9);

// --- domaine général
const tri = M.sommetsDomaine([0.1, 0.1, 0.1], [1, 1, 1]);
assert.equal(tri.length, 3); proche(M.aireRelative(tri), 0.49, 1e-9);
const trap = M.sommetsDomaine([0, 0, 0], [0.5, 1, 1]);
assert.equal(trap.length, 4); proche(M.aireRelative(trap), 0.75, 1e-9);
const entier = M.sommetsDomaine([0, 0, 0], [1, 1, 1]);
assert.equal(entier.length, 3); proche(M.aireRelative(entier), 1, 1e-9);
// hexagone : bornes hautes qui rognent les trois coins
const hexa = M.sommetsDomaine([0, 0, 0], [0.7, 0.7, 0.7]);
assert.equal(hexa.length, 6);

// --- bruit simulé reproductible et approximativement normal
const r1 = M.alea(42), r2 = M.alea(42);
for (let i = 0; i < 5; i++) assert.equal(r1(), r2());
const g = M.alea(7); const xs = Array.from({ length: 4000 }, () => M.gauss(g));
const mo = xs.reduce((a, b) => a + b, 0) / xs.length, va = xs.reduce((a, b) => a + (b - mo) ** 2, 0) / xs.length;
assert.ok(Math.abs(mo) < 0.05 && Math.abs(va - 1) < 0.08);
assert.equal(M.student95(1), 12.706); assert.equal(M.student95(4), 2.776); assert.equal(M.student95(100), 1.96);

// --- coût : linéaire, donc sans interaction
proche(M.coutKg([1, 0, 0]), 100); proche(M.coutKg([0.5, 0.5, 0]), (100 + 7.3 / 240 * 1000) / 2);
proche(M.PRIX[1], 30.4167, 1e-3);

console.log('planMelangeModele : tous les tests passent');
