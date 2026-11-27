import assert from 'node:assert/strict';
import { AMP_ANA, AMP_VAL, AMP_SAPP } from './ampExos.js';
for (const e of AMP_ANA) { assert.equal(e.options.filter(o => o[1]).length, 1, e.id); const L = e.options.map(o => o[0].length); const b = e.options.findIndex(o => o[1]); console.log(e.id, 'bonne', b, L[b], 'max', Math.max(...L)); }
for (const e of AMP_VAL) { assert.equal(e.options.filter(o => o[1]).length, 1, e.id); assert.equal(e.verdict.filter(o => o[1]).length, 1); }
for (const s of AMP_SAPP) for (let i = 0; i < 300; i++) for (const q of [0, 1]) {
  const p = s.gen(), b = s.build(p, q);
  assert.ok(isFinite(b.solution.val) && b.solution.val > 0, `${s.id} ${q}`);
  for (const u of b.utiles) assert.ok(b.tokens[u], `${s.id} token ${u}`);
  for (const k of Object.keys(b.tokens)) assert.ok(b.utiles.includes(k) || b.raisons[k], `${s.id} q${q} : pas de raison pour ${k}`);
  assert.equal(new Set(b.cherche.faux.concat(b.cherche.bonne)).size, 4);
  if (s.id === 'amp-sapp-plage' && q === 1) assert.ok(b.solution.val <= 5 + 1e-9, 'sortie > 5 V');
  if (s.id === 'amp-sapp-gain') assert.ok(p.us <= 5 + 1e-9);
}
console.log('ampExos OK');
