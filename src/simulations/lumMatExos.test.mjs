// Contrôle de la famille REA « bande infrarouge » : node src/simulations/lumMatExos.test.mjs
import assert from 'node:assert/strict';
import { tirageBandeIR } from './lumMatExos.js';
const tire = t => t[Math.floor(Math.random() * t.length)];
const num = s => Number(String(s).replace(/\s| /g, '').replace(',', '.').replace('−', '-'));
const rel = (a, b) => Math.abs(a - b) / Math.abs(b);
const sig = (x, k) => Number(Number(x).toPrecision(k));
const pire = {};
for (let i = 0; i < 3000; i++) {
  const ex = tirageBandeIR(tire);
  for (const q of ex.questions) { assert.ok(q.tolRel >= 0.05, q.id); assert.ok(q.pieges.length >= 1, q.id + ' : aucun piège'); for (const [v] of q.pieges) assert.ok(rel(v, q.vrai) > 0.075, q.id + ' piège dans la tolérance'); }
  const lam = num(ex.intro.match(/λ = (\d+(?:,\d+)?)/)[1]);
  const sigma = 1e4 / lam; assert.ok(rel(ex.questions[0].vrai, sigma) < 1e-9);
  const s2 = num(ex.questions[1].q.match(/σ = (\d+)/)[1]); assert.ok(Math.abs(s2 - sigma) < 1e-6);
  const E20 = 6.63e-34 * 3e8 * s2 * 100 / 1e-20; assert.ok(rel(ex.questions[1].vrai, E20) < 1e-9);
  const E3 = num(ex.questions[2].q.match(/E = (\d+,\d+)/)[1]); assert.ok(rel(ex.questions[2].vrai, E3 * 1e-20 / 1.6e-19) < 1e-9);
  assert.ok(Math.abs(E3 - E20) <= 0.005 + 1e-9);
  const r = num(ex.questions[3].q.match(/λ = (\d+(?:,\d+)?)/)[1]) / 0.25; assert.ok(rel(ex.questions[3].vrai, r) < 1e-9);
  const eV = ex.questions[2].vrai; assert.ok(eV > 0.06 && eV < 0.5, 'ordre de grandeur vibration ' + eV);
  for (const [k, q] of ex.questions.entries()) pire[k] = Math.max(pire[k] ?? 0, rel(sig(q.vrai, 2), q.vrai));
}
console.log('pire cas d’arrondi à 2 chiffres significatifs :', Object.values(pire).map(v => (100 * v).toFixed(2) + ' %'));
for (const v of Object.values(pire)) assert.ok(v <= 0.05);
console.log('Famille REA bande infrarouge : tous les contrôles réussis.');
