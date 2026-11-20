// Contrôle du modèle de la simulation 183 : node src/simulations/itfModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './itfModele.js';
const pres = (a, b, e = 1e-9) => assert.ok(Math.abs(a - b) <= e, `${a} ≠ ${b}`);
// célérité, longueur d’onde, période
pres(M.lambdaCm(20), 2.0); pres(M.lambdaCm(10), 4.0); pres(M.periodeMs(20), 50);
// retard et déphasage au point de la scène de départ (δ = 3,0 cm, λ = 2,0 cm, f = 20 Hz)
pres(M.retardMs(3.0), 75); pres(M.dephasage(3.0, 2.0), 3 * Math.PI);
pres(M.retardMs(3.0) / M.periodeMs(20), 3.0 / 2.0);                 // τ / T = δ / λ
pres(M.dephasage(3.0, 2.0), 2 * Math.PI * M.retardMs(3.0) / M.periodeMs(20));
// point de départ de la scène : δ = 3,0 cm sur la ligne destructive
const P = M.pointSurDelta(6, 3, 14); pres(M.deltaPoint(6, P.x, P.y), 3, 1e-9);
assert.equal(M.nature(3 / 2), 'destructive'); assert.equal(M.nature(2 / 2), 'constructive'); assert.equal(M.nature(4 / 2), 'constructive'); assert.equal(M.nature(1 / 2), 'destructive'); assert.equal(M.nature(0.75), 'intermédiaire');
// somme de deux signaux synchrones de même amplitude
pres(M.ampSomme(1, 1, 0), 2); pres(M.ampSomme(1, 1, Math.PI), 0, 1e-12); pres(M.ampSomme(1, 1, Math.PI / 2), Math.SQRT2); pres(M.ampSomme(1, 1, 3 * Math.PI), 0, 1e-12); pres(M.ampSomme(1, 1, 2 * Math.PI), 2);
for (let i = 0; i < 400; i++) { const t = i * 0.37, d = (i % 25) * 0.3; pres(M.signal1(t, 20) + M.signal2(t, 20, d), M.ampSomme(1, 1, d) * Math.cos(2 * Math.PI * 20 * t * 1e-3 - Math.atan2(Math.sin(d), 1 + Math.cos(d))), 1e-9); }
// amplitude relative dans la cuve : ~1 sur une ligne constructive, ~0 sur une ligne destructive (amplitudes presque égales)
for (const d of [0, 2, 4]) { const p = M.pointSurDelta(6, d, 14); assert.ok(M.amplitudeRelative(6, 2, p.x, p.y) > 0.98, `constructive δ=${d}`); }
for (const d of [1, 3, 5]) { const p = M.pointSurDelta(6, d, 14); assert.ok(M.amplitudeRelative(6, 2, p.x, p.y) < 0.08, `destructive δ=${d} : ${M.amplitudeRelative(6, 2, p.x, p.y)}`); }
// nombre de lignes : 5 constructives et 6 destructives pour s = 6 cm, λ = 2 cm (|δ| < 6 : 0, ±2, ±4 ; ±1, ±3, ±5)
assert.equal(M.nbConstructives(6, 2), 5); assert.equal(M.nbDestructives(6, 2), 6);
assert.equal(M.nbConstructives(10, 4), 5); assert.equal(M.nbDestructives(10, 4), 4);      // δ = 0, ±4, ±8 ; ±2, ±6 (±10 = limite, exclu)
