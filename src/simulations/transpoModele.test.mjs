import assert from 'node:assert/strict';
import { CAS, voie, energie, barriereMigration, gainStabilite } from './transpoModele.js';
for (const c of Object.keys(CAS)) {
  const k = CAS[c]; assert.equal(k.pctA + k.pctB, 100);
  assert.ok(k.E.ct < k.E.cs, 'le cation tertiaire est plus stable');
  assert.ok(barriereMigration(c) > 0 && barriereMigration(c) < 30, 'migration : barrière faible');
  assert.ok(k.E.etS < 100, 'la migration est plus facile que la formation du cation (ET₁ ≈ 100)');
  assert.ok(k.pctB > k.pctA, 'produit transposé majoritaire');
  assert.equal(energie(voie(c, 'B'), 0), k.E.cs); assert.equal(energie(voie(c, 'B'), 1), k.E.p); assert.equal(energie(voie(c, 'A'), 0.35), k.E.et2a);
}
assert.equal(barriereMigration('hydrure'), 15); assert.equal(gainStabilite('hydrure'), 10);
console.log('transpoModele : OK');
