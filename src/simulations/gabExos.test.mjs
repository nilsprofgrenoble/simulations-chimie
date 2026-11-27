import assert from 'node:assert/strict';
import { GAB_ANA, GAB_VAL, GAB_SAPP } from './gabExos.js';
const pos = [0, 0, 0, 0];
for (const e of GAB_ANA) { assert.equal(e.options.filter(o => o[1]).length, 1, e.id); const b = e.options.findIndex(o => o[1]); pos[b]++;
  const L = e.options.map(o => o[0].length); console.log(e.id, 'bonne', L[b], 'max', Math.max(...L)); }
for (const e of GAB_VAL) { assert.equal(e.options.filter(o => o[1]).length, 1, e.id); assert.equal(e.verdict.filter(o => o[1]).length, 1); }
for (const s of GAB_SAPP) for (let i = 0; i < 200; i++) for (const q of [0, 1]) {
  const b = s.build(s.gen(), q);
  assert.ok(isFinite(b.solution.val) && b.solution.val > 0, `${s.id} ${q}`);
  for (const u of b.utiles) assert.ok(b.tokens[u], `${s.id} token ${u}`);
  assert.equal(new Set(b.cherche.faux.concat(b.cherche.bonne)).size, 4);
}
console.log('gabExos OK');
