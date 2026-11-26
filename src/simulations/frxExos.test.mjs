// node src/simulations/frxExos.test.mjs
import assert from 'node:assert/strict';
import { tirageFrx } from './frxExos.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const pire = {};
for (let i = 0; i < 3000; i++) {
  const ex = tirageFrx(tire), [q1, q2, q3] = ex.questions;
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05); assert.ok(q.pieges.length >= 1, q.id + ' aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.075, q.id + ' piège'); }
  const EK = num(ex.intro.match(/E_K = (\d+,\d+)/)[1]), EL = num(ex.intro.match(/E_L = (\d+,\d+)/)[1]);
  assert.ok(Math.abs(q1.vrai - (EK - EL)) < 1e-9 && q1.vrai > 1 && q1.vrai < 9);
  const Ka = num(q2.q.match(/énergie de (\d+,\d+)/)[1]); assert.ok(Math.abs(Ka - q1.vrai) < 1e-9 && rel(q2.vrai, 1.243 / Ka) < 1e-9);
  const m = q3.q.match(/à (\d+,\d+)\s% donne (\d+)\scoups\/s et l’échantillon (\d+)\scoups/); const w = num(m[1]), IEt = num(m[2]), I = num(m[3]);
  assert.ok(rel(q3.vrai, w * I / IEt) < 1e-9 && q3.vrai >= 0.9 && q3.vrai <= 15.5, 'teneur');
  ex.questions.forEach((q, j) => { pire[j] = Math.max(pire[j] ?? 0, rel(sig(q.vrai, q.csMin), q.vrai)); });
}
console.log('pire cas d’arrondi :', Object.values(pire).map(v => (100 * v).toFixed(2) + ' %'));
for (const v of Object.values(pire)) assert.ok(v <= 0.05);
console.log('Famille REA fluorescence X : tous les contrôles réussis.');
