// node src/simulations/chromoExos.test.mjs
import assert from 'node:assert/strict';
import { tirageChromo } from './chromoExos.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const pire = {};
for (let i = 0; i < 3000; i++) {
  const ex = tirageChromo(tire);
  const eps = num(ex.intro.match(/ε = (\d+)/)[1]), lam = num(ex.intro.match(/λmax = (\d+)/)[1]), l = num(ex.intro.match(/l = (\d+,\d)/)[1]), c = num(ex.intro.match(/c = (\d+(?:,\d+)?)/)[1]);
  const A = eps * l * c * 1e-6; assert.ok(A >= 0.15 - 1e-9 && A <= 1.2 + 1e-9, 'A hors plage ' + A); assert.ok(rel(ex.questions[0].vrai, A) < 1e-9, 'vrai ' + [ex.questions[0].vrai, A, eps, l, c]);
  const Ar = num(ex.questions[1].q.match(/A = (\d+,\d+)/)[1]); assert.ok(rel(Ar, A) <= 0.05 + 1e-9);
  assert.ok(rel(ex.questions[1].vrai, Ar / (eps * l) * 1e6) < 1e-9);
  assert.ok(rel(ex.questions[2].vrai, 1243 / lam) < 1e-9);
  assert.ok(rel(ex.questions[3].vrai, 100 * 10 ** -Ar) < 1e-9);
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05); assert.ok(q.pieges.length >= 1, q.id + ' aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.075, q.id + ' piège'); }
  ex.questions.forEach((q, j) => { pire[j] = Math.max(pire[j] ?? 0, rel(sig(q.vrai, q.csMin), q.vrai)); });
}
console.log('pire cas d’arrondi :', Object.values(pire).map(v => (100 * v).toFixed(2) + ' %'));
for (const v of Object.values(pire)) assert.ok(v <= 0.05);
console.log('Famille REA chromophores : tous les contrôles réussis.');
