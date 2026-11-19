import assert from 'node:assert/strict';
import { ESPECES, epsilon, absorbance, regression, M_CUSO4 } from './beerLambert1GModele.js';
// Beer-Lambert : A = ε ℓ c, proportionnelle à c aux faibles absorbances (blanc fait, bruit ≤ 3 mUA)
const c1 = 0.02, c2 = 0.04;
const A1 = absorbance('cuivre', c1, 810, true, 1, 0), A2 = absorbance('cuivre', c2, 810, true, 1, 1);
assert.ok(Math.abs(A1 - epsilon('cuivre', 810) * c1) < 0.01 && Math.abs(A2 / A1 - 2) < 0.1);
// le blanc retire la ligne de base : eau sans blanc > 0, avec blanc ≈ 0
assert.ok(absorbance('cuivre', 0, 600, false, 1, 0) > 0.03 && Math.abs(absorbance('cuivre', 0, 600, true, 1, 0)) < 0.004);
// maximum d'absorption du cuivre vers 810 nm
let best = 380, bv = 0; for (let l = 380; l <= 900; l++) { const e = epsilon('cuivre', l); if (e > bv) { bv = e; best = l; } }
assert.ok(Math.abs(best - 810) <= 5);
// saturation aux fortes absorbances : A affichée < A théorique
assert.ok(absorbance('e133', 14e-6, 630, true, 1, 0) < epsilon('e133', 630) * 14e-6);
// régression par l'origine : pente exacte sur des données proportionnelles
const r = regression([1, 2, 3, 4], [2, 4, 6, 8], true); assert.ok(Math.abs(r.a - 2) < 1e-12 && Math.abs(r.R2 - 1) < 1e-12);
// c_X = A_X / k aller-retour sur la gamme du cuivre
const G = ESPECES.cuivre.gamme, k = regression(G, G.map((c, i) => absorbance('cuivre', c, 810, true, 1, i)), true).a;
const cX = 0.06, AX = absorbance('cuivre', cX, 810, true, 1, 7); assert.ok(Math.abs(AX / k - cX) / cX < 0.05);
assert.ok(Math.abs(M_CUSO4 - 249.68) < 1e-9);
console.log('beerLambert1GModele : OK');
