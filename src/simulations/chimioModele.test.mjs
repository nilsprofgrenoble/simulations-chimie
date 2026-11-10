import assert from 'node:assert/strict';
import { SUBSTRATS, COUPLES, bilan } from './chimioModele.js';
assert.equal(COUPLES.length, 8);
for (const [s, r] of COUPLES) { const b = bilan(s, r); assert.ok(b.nb >= 0 && b.nb <= 2); assert.equal(b.apres.length, SUBSTRATS[s].avant.length); }
assert.equal(bilan('cetoester', 'NaBH4').chimiosel, true); assert.deepEqual(bilan('cetoester', 'NaBH4').touches, ['A']);
assert.equal(bilan('cetoester', 'LiAlH4').nb, 2); assert.equal(bilan('cetoester', 'H2Pd').nb, 0);
assert.deepEqual(bilan('alcenone', 'H2Pd').touches, ['B']); assert.deepEqual(bilan('alcenone', 'NaBH4').touches, ['A']);
assert.deepEqual(bilan('aminophenol', 'Ac2O').touches, ['B']); assert.equal(bilan('aminophenol', 'Ac2Oexc').nb, 2);
console.log('chimioModele : OK');
