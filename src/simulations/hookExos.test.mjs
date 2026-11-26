// node src/simulations/hookExos.test.mjs
import assert from 'node:assert/strict';
import { tirageHooke } from './hookExos.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s/g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const pire = {};
for (let i = 0; i < 3000; i++) {
  const ex = tirageHooke(tire);
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05); assert.ok(q.pieges.length >= 1, q.id + ' aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.075, q.id + ' piège'); }
  const [m1, m2] = [...ex.intro.matchAll(/(\d+)\s*u\s/g)].map(m => num(m[1])), k = num(ex.intro.match(/k = (\d+)/)[1]);
  const mu = m1 * m2 / (m1 + m2); assert.ok(rel(ex.questions[0].vrai, mu) < 1e-9);
  const mu2 = num(ex.questions[1].q.match(/μ = (\d+,\d+)/)[1]); assert.ok(Math.abs(mu2 - mu) <= 5.1e-4);
  const s = Math.sqrt(k / (mu2 * 1.66e-27)) / (2 * Math.PI * 3e8 * 100); assert.ok(rel(ex.questions[1].vrai, s) < 1e-9); assert.ok(s > 900 && s < 4000, 'σ ' + s);
  const s3 = num(ex.questions[2].q.match(/σ = (\d+)/)[1]); assert.ok(Math.abs(s3 - s) <= 0.5 + 1e-9); assert.ok(rel(ex.questions[2].vrai, 1e4 / s3) < 1e-9);
  const s4 = num(ex.questions[3].q.match(/σ = (\d+)/)[1]); assert.ok(s4 === s3 && rel(ex.questions[3].vrai, 6.63e-34 * 3e8 * s4 * 100 / 1.6e-19) < 1e-9);
  ex.questions.forEach((q, j) => { pire[j] = Math.max(pire[j] ?? 0, rel(sig(q.vrai, q.csMin), q.vrai)); });
}
console.log('pire cas d’arrondi :', Object.values(pire).map(v => (100 * v).toFixed(2) + ' %'));
for (const v of Object.values(pire)) assert.ok(v <= 0.05);
console.log('Famille REA Hooke : tous les contrôles réussis.');
