import assert from 'node:assert';
import * as S from './syntheseModele.js';
const b = S.bilan({ m1: 3.40, m2: 3.35 });
assert.ok(Math.abs(b.n1 * 1000 - 24.97) < 0.01 && Math.abs(b.n2 * 1000 - 24.966) < 0.01);
assert.equal(b.limitant, 'les deux');
assert.ok(Math.abs(b.mth - 6.30) < 0.01, 'mth ≈ 6,30 g');
const c = S.bilan({ m1: 4.00, m2: 3.35 }); assert.equal(c.limitant, 'acetophenone'); assert.ok(c.n1f > 0 && Math.abs(c.n2f) < 1e-12);
const d = S.bilan({ m1: 3.00, m2: 3.35 }); assert.equal(d.limitant, 'anisaldehyde');
assert.ok(Math.abs(S.rendement(5.46, b.mth) - 0.867) < 0.002);
const E = S.EXEMPLE; assert.equal(S.indiceSec(E.pesees), 4);       // 47,81 = 47,81 : sec à partir de la pesée n°5 (indice 4)
assert.ok(Math.abs(E.pesees[5] - E.mBoite - 5.46) < 0.005);
const p = S.pesees({ mBoite: 40, mSec: 5, mEau0: 3 }); assert.ok(p[0] > p[3] && p[6] - 45 < 0.05);
assert.ok(S.indiceSec(p) >= 0);
console.log('syntheseModele : tous les tests passent');
