import assert from 'node:assert/strict';
import { modeleLugol, erlenLugol, dosageDepuisVe, M_I2 } from './titrageDirectModele.js';
const m = modeleLugol({});
assert.ok(Math.abs(m.cA - 10 / M_I2) < 1e-12);                       // 1,00 g / 100 mL
assert.ok(Math.abs(m.Veq - 2 * m.nI2 / 0.05 * 1000) < 1e-9);
assert.ok(Math.abs(m.Veq - 15.76) < 0.01, 'Veq ≈ 15,76 mL');
// avant l'équivalence : il reste du diiode ; à l'équivalence : plus rien ; après : thiosulfate en excès
assert.ok(erlenLugol(m, 10).nI2 > 0 && erlenLugol(m, 10).nThio === 0);
assert.ok(erlenLugol(m, m.Veq).nI2 < 1e-15 && erlenLugol(m, m.Veq).nThio < 1e-15);
assert.ok(erlenLugol(m, 20).nI2 === 0 && erlenLugol(m, 20).nThio > 0);
// aller-retour : le volume équivalent redonne l'étiquette
const d = dosageDepuisVe(m.Veq);
assert.ok(Math.abs(d.m100 - 1.00) < 1e-9);
assert.ok(Math.abs(d.cA - m.cA) < 1e-12);
// conservation : n(S₂O₃²⁻) versé = 2 n(I₂) consommé
const e = erlenLugol(m, 8); assert.ok(Math.abs((m.nI2 - e.nI2) * 2 - 0.05 * 8 / 1000) < 1e-15);
// dépassement de la burette : concentration forte
assert.ok(modeleLugol({ t: 2, VA: 20 }).Veq > 25);
console.log('titrageDirectModele : OK');
