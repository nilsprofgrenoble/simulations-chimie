// node src/simulations/fluoExos.test.mjs
import assert from 'node:assert/strict';
import { tirageStokes } from './fluoExos.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const pire = {};
for (let i = 0; i < 3000; i++) {
  const ex = tirageStokes(tire);
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05); assert.ok(q.pieges.length >= 1, q.id); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.075, q.id + ' piège'); }
  const [la, le] = [...ex.intro.matchAll(/(\d+)\s*nm/g)].map(m => num(m[1]));
  assert.ok(rel(ex.questions[0].vrai, 1243 / la) < 1e-9 && rel(ex.questions[1].vrai, 1243 / le) < 1e-9); assert.ok(le > la);
  const [Ea, Ee] = [...ex.questions[2].q.matchAll(/= (\d+,\d+)/g)].map(m => num(m[1])); assert.ok(Math.abs(Ea - 1243 / la) < 6e-4 && Math.abs(Ee - 1243 / le) < 6e-4);
  assert.ok(rel(ex.questions[2].vrai, Ea - Ee) < 1e-9);
  const [Ea2, dE2] = [...ex.questions[3].q.matchAll(/(\d+,\d+)\s/g)].map(m => num(m[1])); assert.ok(Math.abs(Ea2 - Ea) < 1e-9 && rel(ex.questions[3].vrai, dE2 / Ea2 * 100) < 1e-9);
  assert.ok(ex.questions[3].vrai > 10 && ex.questions[3].vrai < 70);
  ex.questions.forEach((q, k) => { pire[k] = Math.max(pire[k] ?? 0, rel(sig(q.vrai, 2), q.vrai)); });
}
console.log('pire cas d’arrondi :', Object.values(pire).map(v => (100 * v).toFixed(2) + ' %'));
for (const v of Object.values(pire)) assert.ok(v <= 0.05);
console.log('Famille REA Stokes : tous les contrôles réussis.');
