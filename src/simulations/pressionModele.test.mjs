// Tests du modèle de la simulation 162 : node src/simulations/pressionModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './pressionModele.js';

const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
// conversions
assert.ok(proche(M.hPa_Pa(1013), 101300)); assert.ok(proche(M.bar_Pa(2.0), 2e5)); assert.ok(proche(M.cm2_m2(6.0), 6e-4)); assert.ok(proche(M.bar_hPa(1.5), 1500));
// force pressante : 2,0 bar sur 6,0 cm² → 120 N
assert.ok(proche(M.forcePressante(M.bar_Pa(2.0), M.cm2_m2(6.0)), 120));
assert.ok(proche(M.pressionDepuisForce(120, 6e-4), 2e5));
// force sur un hublot : 1013 hPa sur 1 m² → 1,013 × 10⁵ N
assert.ok(proche(M.forcePressante(M.hPa_Pa(M.P_ATM), 1), 101300));
// Mariotte
assert.ok(proche(M.pressionFinale(1.5, 80, 25), 4.8)); assert.ok(proche(M.volumeFinal(1.5, 80, 4.8), 25));
// état initial : 1013 hPa à 60 mL, 20 °C, quel que soit le volume du tuyau
for (const Vt of [0, 2, 5]) assert.ok(proche(M.pression({ V: 60, Vt }), 1013), `Vt=${Vt}`);
// P·V constant à T et n constants (Vt = 0), et P·(V+Vt) constant sinon
for (let V = 10; V <= 60; V += 5) {
  assert.ok(proche(M.pression({ V }) * V, 1013 * 60), `PV V=${V}`);
  assert.ok(proche(M.pression({ V, Vt: 4 }) * (V + 4), 1013 * 64), `P(V+Vt) V=${V}`);
}
// avec un volume de tuyau, P·V n'est plus constant (il diminue quand V diminue)
assert.ok(M.pression({ V: 20, Vt: 4 }) * 20 < M.pression({ V: 60, Vt: 4 }) * 60 - 100);
// la pression augmente avec la température (V constant) et avec la quantité de gaz
assert.ok(M.pression({ V: 30, thetaC: 80 }) > M.pression({ V: 30, thetaC: 20 }));
assert.ok(M.pression({ V: 30, n: 1.5 }) > M.pression({ V: 30 }));
// mesures : écart ≤ 0,5 %, arrondi à 1 hPa, produits constants à 1 % près sur tout V = 10…60 mL (pas de 1 mL)
let maxEcart = 0;
for (let V = 10; V <= 60; V++) {
  const e = Math.abs(M.ecartMesure(V)); maxEcart = Math.max(maxEcart, e);
  assert.ok(e <= 0.005 + 1e-12, `écart V=${V}`);
  const Pm = M.pressionMesuree({ V }); assert.ok(Number.isInteger(Pm) && Pm > 0);
  assert.ok(Math.abs(Pm * V / (1013 * 60) - 1) < 0.0075, `produit V=${V}`);
}
// le tableau du parcours guidé : 60, 50, 40, 30, 20 mL → produits égaux à ± 1 %
const prod = [60, 50, 40, 30, 20].map(V => M.pressionMesuree({ V }) * V);
const moy = prod.reduce((a, b) => a + b) / prod.length;
prod.forEach(p => assert.ok(Math.abs(p / moy - 1) < 0.01, 'produit du tableau'));
// mais pas EXACTEMENT égaux (sinon l'étape « incertitudes » n'aurait pas de sens)
assert.ok(new Set(prod).size > 1);
// volume 30 mL = moitié de 60 mL : pression ≈ double
assert.ok(Math.abs(M.pressionMesuree({ V: 30 }) / M.pressionMesuree({ V: 60 }) - 2) < 0.03);
// forces sur le piston : à 60 mL, le gaz et l'air extérieur se compensent
const f60 = M.forcesPiston(M.pression({ V: 60 }), 6); assert.ok(Math.abs(f60.Fmain) < 1e-9);
const f30 = M.forcesPiston(M.pression({ V: 30 }), 6); assert.ok(f30.Fmain > 0 && proche(f30.Fgaz, 2026 * 100 * 6e-4, 1e-6));
// niveau du cadran borné
assert.ok(M.niveauCadran(0, 3000) >= 0.03 && M.niveauCadran(1e9, 3000) === 1);
// défis : 20 000 graines, aucune valeur absurde, bonne réponse exacte à 3 chiffres significatifs, aucun NaN / division par zéro
for (let g = 1; g <= 20000; g++) {
  const rng = M.rngGraine(g), d1 = M.tirerDefiForce(rng), d2 = M.tirerDefiMariotte(rng);
  for (const d of [d1, d2]) { assert.ok(isFinite(d.vrai) && d.vrai > 0, `défi ${g}`); assert.ok(proche(M.arrondiCS(d.vrai, 3), d.vrai, 1e-9), `3 CS ${g}`); }
  if (d1.variante === 'force') { const P = d1.uP === 'bar' ? M.bar_Pa(d1.P) : M.hPa_Pa(d1.P); assert.ok(proche(M.forcePressante(P, M.cm2_m2(d1.S)), d1.vrai)); }
  else assert.ok(proche(M.hPa_Pa(d1.vrai) * M.cm2_m2(d1.S), d1.F));
  assert.ok(d1.F >= 10 && d1.F <= 5000);
  if (d2.variante === 'P2') assert.ok(proche(d2.P1 * d2.V1, d2.P2 * d2.V2) && d2.P2 <= 5); else assert.ok(proche(d2.P1 * d2.V1, d2.P2 * d2.vrai));
  assert.notEqual(d2.V1, d2.V2);
}
console.log('OK : modèle de la simulation 162 (pression, force pressante, Mariotte)');
