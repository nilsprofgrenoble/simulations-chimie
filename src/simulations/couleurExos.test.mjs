// Contrôle des familles REA couleur : node src/simulations/couleurExos.test.mjs
// On relit le TEXTE AFFICHÉ, on refait le calcul avec les seuls nombres écrits, on compare à la réponse attendue ; pire cas d'arrondi à 2 chiffres significatifs ; pièges hors tolérance.
import assert from 'node:assert/strict';
import { tirageLab, tirageXyy, tirageFiltres, chromaH } from './couleurExos.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s| /g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const pire = {};
const note = (k, v) => { pire[k] = Math.max(pire[k] ?? 0, v); };
const base = ex => { for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05, q.id); assert.ok(q.pieges.length >= 1, q.id + ' : aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.08, `${q.id} : piège dans la tolérance`); assert.ok(q.aide && q.expl); } };
const ints = t => [...t.matchAll(/(−?\d+)(?=[ ,;.]|$)/g)].map(m => num(m[1]));
for (let i = 0; i < 4000; i++) {
  // Lab
  let ex = tirageLab(tire); base(ex);
  const m = [...ex.intro.matchAll(/L\* = (−?\d+), a\* = (−?\d+), b\* = (−?\d+)/g)].map(x => [num(x[1]), num(x[2]), num(x[3])]);
  const [[Lc, ac, bc], [L, a, b]] = m; const { C, h } = chromaH(a, b), dE = Math.sqrt((L - Lc) ** 2 + (a - ac) ** 2 + (b - bc) ** 2);
  assert.ok(rel(ex.questions[0].vrai, C) < 1e-9 && rel(ex.questions[1].vrai, h) < 1e-9 && rel(ex.questions[2].vrai, dE) < 1e-9, 'lab');
  assert.ok(h >= 0 && h < 360); assert.ok(dE >= 3.3 && dE <= 9, 'ΔE ' + dE);
  note('C', rel(sig(C, 2), C)); note('h', rel(sig(h, 3), h)); note('dE', rel(sig(dE, 2), dE));
  // xy
  ex = tirageXyy(tire); base(ex);
  const co = [...ex.intro.matchAll(/\((\d,\d+) ; (\d,\d+)\)/g)].map(x => [num(x[1]), num(x[2])]); const [P, W, D] = co;
  const WP = Math.hypot(P[0] - W[0], P[1] - W[1]), WD = Math.hypot(D[0] - W[0], D[1] - W[1]);
  assert.ok(rel(ex.questions[0].vrai, WP) < 1e-9 && rel(ex.questions[1].vrai, WD) < 1e-9, 'xy');
  const [a1, a2] = [...ex.questions[2].q.matchAll(/= (\d,\d+)/g)].map(x => num(x[1])); assert.ok(rel(a1 / a2, ex.questions[2].vrai) < 1e-9, 'pureté');
  assert.ok(ex.questions[2].vrai > 0.25 && ex.questions[2].vrai < 0.75);
  note('WP', rel(sig(WP, 2), WP)); note('WD', rel(sig(WD, 2), WD)); note('pur', rel(sig(ex.questions[2].vrai, 2), ex.questions[2].vrai));
  // filtres
  ex = tirageFiltres(tire); base(ex);
  const [T1, T2] = [...ex.intro.matchAll(/= (\d,\d+)/g)].map(x => num(x[1]));
  const A1 = -Math.log10(T1), A2 = -Math.log10(T2); assert.ok(rel(ex.questions[0].vrai, A1) < 1e-9);
  const [b1, b2] = [...ex.questions[1].q.matchAll(/= (\d,\d+)/g)].map(x => num(x[1])); assert.ok(Math.abs(b1 - A1) < 6e-4 && Math.abs(b2 - A2) < 6e-4); assert.ok(rel(ex.questions[1].vrai, b1 + b2) < 1e-9);
  const At = num(ex.questions[2].q.match(/A = (\d,\d+)/)[1]); assert.ok(rel(ex.questions[2].vrai, 10 ** -At) < 1e-9); assert.ok(rel(ex.questions[2].vrai, T1 * T2) < 0.01, 'T = T1×T2');
  const Tp = num(ex.questions[3].q.match(/T = (\d,\d+)/)[1]); assert.ok(rel(ex.questions[3].vrai, (1 - Tp) * 100) < 1e-9);
  note('A1', rel(sig(A1, 2), A1)); note('At', rel(sig(b1 + b2, 2), b1 + b2)); note('Tt', rel(sig(ex.questions[2].vrai, 2), ex.questions[2].vrai)); note('abs', rel(sig(ex.questions[3].vrai, 2), ex.questions[3].vrai));
}
console.log('pire cas d’arrondi (relatif) :', Object.fromEntries(Object.entries(pire).map(([k, v]) => [k, Number((100 * v).toFixed(2)) + ' %'])));
for (const k of ['C', 'dE', 'A1', 'At', 'Tt', 'abs', 'WP', 'WD', 'pur']) assert.ok(pire[k] <= 0.06, k + ' ' + pire[k]);
assert.ok(pire.h <= 0.05);
console.log('Familles REA couleur : tous les contrôles réussis.');
