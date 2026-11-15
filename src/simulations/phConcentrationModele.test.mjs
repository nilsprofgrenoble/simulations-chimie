// Test du modèle « pH et concentration en ions oxonium » : node src/simulations/phConcentrationModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './phConcentrationModele.js';

const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t;

// relation pH = −log([H₃O⁺]/c°) et réciproque
assert.ok(proche(M.pHDeConc(1e-2), 2));
assert.ok(proche(M.pHDeConc(1e-3), 3));
assert.ok(proche(M.pHDeConc(4.0e-3), 2.39794, 1e-5));       // −log(4,0×10⁻³) = 3 − 0,60206
assert.ok(proche(M.pHDeConc(2.5e-5), 4.60206, 1e-5));
assert.ok(proche(M.concDePH(3.40), 3.98107e-4, 1e-9));
assert.ok(proche(M.concDePH(M.pHDeConc(7.3e-4)), 7.3e-4, 1e-15));
// c° = 1 mol/L : diviser par c° ne change pas la valeur numérique
assert.equal(M.C_STD, 1);

// dilutions d'un facteur 10 : pH + 1 ; facteur 100 : pH + 2 ; facteur 1000 : pH + 3
assert.ok(proche(M.pHApresDilution(2.0, 10), 3.0));
assert.ok(proche(M.pHApresDilution(2.0, 100), 4.0));
assert.ok(proche(M.pHApresDilution(2.40, 1000), 5.40));
for (const C0 of [1e-1, 3.0e-2, 4.0e-3]) for (let k = 0; k < 5; k++)
  assert.ok(proche(M.pHDeConc(M.concApres(C0, k + 1)) - M.pHDeConc(M.concApres(C0, k)), 1, 1e-9));

// pH « lu » (calcul complet, autoprotolyse comprise) : très proche de la relation pour C ≥ 10⁻⁶ mol/L
assert.equal(M.pHMesure(1e-2), 2);
assert.equal(M.pHMesure(1e-3), 3);
assert.equal(M.pHMesure(1e-5), 5);
assert.equal(M.pHMesure(1e-6), 6);                          // 5,9957 lu 6,00
assert.ok(Math.abs(M.ecartRelation(1e-6)) < 0.005);
assert.ok(M.relationValable(1e-6) && M.relationValable(1e-1) && !M.relationValable(1e-7));
assert.ok(proche(M.pHExact(1e-7), 6.79, 0.005));
assert.ok(proche(M.pHExact(1e-8), 6.98, 0.005));
assert.ok(M.pHExact(1e-9) < 7 && M.pHExact(1e-12) < 7);   // une solution d'acide reste acide
assert.ok(M.pHImpossible(1e-9) && !M.pHImpossible(1e-6));

// série S0 … S6 à partir de 1,0×10⁻² mol/L
const s = M.serie(1e-2, 6);
assert.equal(s.length, 7);
assert.deepEqual(s.map(l => l.pHMes), [2, 3, 4, 5, 6, 6.79, 6.98]);
assert.ok(s.slice(0, 5).every(l => Math.abs(l.ecart) < 0.005));

// arrondi
assert.equal(M.arrondi(2.397940, 2), 2.4);
console.log('phConcentrationModele : tous les tests passent');
