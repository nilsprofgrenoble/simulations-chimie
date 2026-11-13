import assert from 'node:assert';
import * as C from './ccmModele.js';
assert.ok(Math.abs(C.rf('chalcone') - 0.45) < 1e-9 && Math.abs(C.rf('acetophenone') - 0.65) < 1e-9);
assert.equal(C.distance('chalcone', 6.0), 2.7); assert.equal(C.distance('anisaldehyde', 6.0), 3.3); assert.equal(C.distance('acetophenone', 6.0), 3.9);
assert.ok(C.rf('chalcone', 0.8) > C.rf('chalcone', 0.5) && C.rf('chalcone', 0.2) < C.rf('chalcone', 0.5), 'éluant plus polaire : Rf plus grand');
assert.ok(C.rf('acetophenone', 1) <= 0.95);
const p = C.plaque({ front: 6.0, produit: 'brut' }); assert.equal(p.voies.length, 4); assert.equal(p.voies[0].taches.length, 2);
assert.equal(C.plaque({ produit: 'recris' }).voies[0].taches.length, 1);
assert.ok(Math.abs(C.rfDe(2.7, 6.0) - 0.45) < 1e-9);
const f0 = C.fusion(0), f5 = C.fusion(5); assert.ok(f0.fin < C.TF_LIT && f5.fin < f0.fin && f5.largeur > f0.largeur);
assert.ok(C.compatibleTf(97) && !C.compatibleTf(93));
// Rf toujours <= 1 sur tout éluant
for (let e = 0; e <= 1; e += 0.1) for (const n of Object.keys(C.ESPECES)) assert.ok(C.rf(n, e) <= 0.95 + 1e-9 && C.rf(n, e) > 0);
console.log('ccmModele : tous les tests passent');
