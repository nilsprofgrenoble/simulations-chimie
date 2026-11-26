import assert from 'node:assert/strict';
import { HYD_ANA, HYD_VAL, HYD_SAPP } from './hydExos.js';
for (const e of [...HYD_ANA, ...HYD_VAL]) {
  const o = e.options, vrais = o.filter(x => x[1]);
  assert.equal(vrais.length, 1, e.id);
  assert.ok(vrais[0][0].length < Math.max(...o.map(x => x[0].length)), `${e.id} : la bonne réponse est la plus longue`);
  assert.equal(new Set(o.map(x => x[0])).size, o.length, e.id);
}
console.log('positions ANA', HYD_ANA.map(e => e.options.findIndex(x => x[1])).join(','));
for (let i = 0; i < 400; i++) for (const e of HYD_SAPP) {
  const p = e.gen(), b0 = e.build(p, 0), b1 = e.build(p, 1);
  for (const b of [b0, b1]) { assert.ok(isFinite(b.solution.val) && b.solution.val > 0, `${e.id} ${b.solution.val}`); assert.ok(b.utiles.every(u => b.tokens[u]), e.id + ' jeton utile manquant'); }
  assert.notEqual(b0.solution.val, b1.solution.val, e.id + ' : deux questions de même réponse');
}
console.log('hydExos : OK');
