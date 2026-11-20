// Test des volumes et niveaux du montage de la simulation 189 : node src/simulations/optMontage.test.mjs
import assert from 'node:assert/strict';
import * as D from './optMontageModele.js';
assert.ok(Math.abs(D.VOL_MOL.acide - 57.19) < 0.01 && Math.abs(D.VOL_MOL.eth - 58.39) < 0.01);
assert.equal(Math.round(D.volumeMelange(1, 1) * 10) / 10, 115.6);
assert.ok(D.volumeMelange(1, 5) + D.ML_ENTRAINEUR <= 0.6 * D.ML_BALLON, 'excès maximal + entraîneur : au plus 60 % du ballon');
let prec = -1; for (const r of [1, 2, 3, 5]) { const h = D.hauteurNiveau(D.volumeMelange(1, r)); assert.ok(h > prec); prec = h; }
// h(V) est l'inverse de V(h) = V0 h²(3R − h)/(4R³)
for (const V of [50, 116, 174, 233, 349, 450]) { const h = D.hauteurNiveau(V), R = 56; assert.ok(Math.abs(D.ML_BALLON * h * h * (3 * R - h) / (4 * R ** 3) - V) < 0.01); }
assert.ok(D.hauteurNiveau(0) < 1e-6);
console.log('optMontage : OK (volumes 115,6 mL pour 1 mol + 1 mol ; niveaux croissants avec l’excès)');
