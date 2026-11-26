import assert from 'node:assert/strict';
import { TSOL_ANA, TSOL_VAL, TSOL_SAPP } from './tsolExos.js';
const pos = [0, 0, 0, 0];
for (const ex of TSOL_ANA) {
  assert.equal(ex.options.filter(o => o[1]).length, 1, ex.id);
  const bonne = ex.options.findIndex(o => o[1]); pos[bonne]++;
  const L = ex.options.map(o => o[0].length); assert.ok(L[bonne] < Math.max(...L) || L.filter(x => x === Math.max(...L)).length > 1, 'bonne réponse la plus longue : ' + ex.id);
  assert.equal(new Set(ex.options.map(o => o[0])).size, ex.options.length, 'doublon ' + ex.id);
}
console.log('positions ANA', pos.join(','));
for (const ex of TSOL_VAL) { assert.equal(ex.options.filter(o => o[1]).length, 1, ex.id); assert.equal(ex.verdict.filter(v => v[1]).length, 1); }
for (const ex of TSOL_SAPP) for (let i = 0; i < 400; i++) {
  const p = ex.gen();
  for (const q of [0, 1]) {
    const b = ex.build(p, q);
    assert.ok(Number.isFinite(b.solution.val) && b.solution.val > 0, ex.id);
    assert.ok(b.utiles.every(k => b.tokens[k]), 'utile absent ' + ex.id + k(b));
    assert.equal(new Set(b.cherche.faux).size, b.cherche.faux.length); assert.ok(!b.cherche.faux.includes(b.cherche.bonne));
  }
}
function k(b) { return JSON.stringify(b.utiles); }
console.log('tsolExos : OK');
