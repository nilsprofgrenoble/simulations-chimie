import assert from 'node:assert/strict';
import { SUBSTRATS, REACTIFS, proportions, profil, energieEn, barriere } from './snModele.js';
for (const s of Object.keys(SUBSTRATS)) for (const r of Object.keys(REACTIFS)) for (const ch of [false, true]) {
  const q = proportions(s, r, ch);
  if (q.reaction) { assert.equal(q.substitution + q.elimination, 100, `${s}|${r}`); assert.equal(Object.values(q.p).reduce((a, b) => a + b), 100); assert.ok(q.dominant); }
  else assert.equal(q.dominant, null);
}
// tendances : chauffer favorise l'élimination ; tertiaire + HO⁻ : E2 ; primaire + HO⁻ : SN2 ; tertiaire + eau : SN1
for (const s of Object.keys(SUBSTRATS)) for (const r of Object.keys(REACTIFS)) { const f = proportions(s, r, false), c = proportions(s, r, true); if (f.reaction) assert.ok(c.elimination >= f.elimination, `T ${s}|${r}`); }
assert.equal(proportions('prim', 'HO', false).dominant, 'SN2');
assert.equal(proportions('tert', 'HO', false).dominant, 'E2');
assert.equal(proportions('tert', 'H2O', false).dominant, 'SN1');
assert.equal(proportions('prim', 'tBuO', false).dominant, 'E2');
assert.equal(proportions('sec', 'H2O', true).dominant, 'SN1');
assert.ok(barriere('SN2', 'tert', 'HO') > barriere('E2', 'tert', 'HO'));
assert.ok(barriere('SN2', 'prim', 'HO') < barriere('E2', 'prim', 'HO'));
assert.ok(barriere('SN2', 'prim', 'tBuO') > barriere('E2', 'prim', 'tBuO'));
assert.equal(profil('SN1', 'tert', 'H2O').etapes, 2);
assert.equal(energieEn(profil('SN2', 'prim', 'HO').pts, 0.5), 85);
console.log('snModele : OK');
