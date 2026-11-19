import assert from 'node:assert/strict';
import { chute, vApprox, deltaV, gDe, SITUATIONS } from './chuteModele.js';
const near = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${a} ≠ ${b}`);
// lâcher : v = −g·t, l'approximation centrée est exacte
let d = chute({ v0: 0, g: 9.8, tau: 0.2 });
for (let i = 1; i < d.N - 1; i++) near(vApprox(d, i), d.v[i]);
near(deltaV(d, 2), -9.8 * 0.2);                       // Δv = −g·τ
near(d.y[4], -0.5 * 9.8 * 0.64);                      // y(0,8 s)
near(vApprox(d, 3), -5.88); near(vApprox(d, 4), -7.84);
// lancer vers le haut : Δv toujours vers le bas (négatif), même quand la vitesse est positive
d = chute({ v0: 6, g: 9.8, tau: 0.2 });
for (let i = 1; i < d.N - 2; i++) assert.ok(deltaV(d, i) < 0);
assert.ok(vApprox(d, 1) > 0 && vApprox(d, 6) < 0);    // monte puis redescend
// Lune : Δv plus petit
near(deltaV(chute({ g: gDe('lune'), tau: 0.2 }), 2), -1.6 * 0.2);
// valeurs de la fiche et des étapes : M2M4 = 2,35 m en 0,40 s → 5,9 m/s
d = chute({ v0: 0, g: 9.8, tau: 0.2 }); near(Math.abs(d.y[4] - d.y[2]), 2.352, 1e-6);
assert.equal(SITUATIONS.length, 8);
console.log('chuteModele : OK');
