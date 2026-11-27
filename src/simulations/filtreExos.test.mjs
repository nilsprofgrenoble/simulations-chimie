import assert from 'node:assert/strict';
import { FILT_ANA, FILT_VAL, FILT_SAPP } from './filtreExos.js';
for (const e of FILT_ANA) { assert.equal(e.options.filter(o => o[1]).length, 1, e.id); }
for (const e of FILT_VAL) { assert.equal(e.options.filter(o => o[1]).length, 1, e.id); assert.equal(e.verdict.filter(o => o[1]).length, 1); }
for (const s of FILT_SAPP) for (let i = 0; i < 150; i++) for (const q of [0, 1]) {
  const p = s.gen(), b = s.build(p, q);
  assert.ok(isFinite(b.solution.val) && b.solution.val > 0, `${s.id} ${q}`);
  for (const u of b.utiles) assert.ok(b.tokens[u], `${s.id} token ${u}`);
  assert.equal(new Set(b.cherche.faux.concat(b.cherche.bonne)).size, 4);
}
console.log('filtreExos OK');
