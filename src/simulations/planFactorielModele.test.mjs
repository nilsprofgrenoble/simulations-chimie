import assert from 'node:assert/strict';
import * as M from './planFactorielModele.js';
const proche = (a, b, t = 1e-6) => assert.ok(Math.abs(a - b) < t, `${a} ≠ ${b}`);
const { flan, vin4, vin5 } = M.JEUX;

// orthogonalité des plans : toutes les colonnes de termes distincts (d'ordre ≤ 2) sont orthogonales (sauf alias de la fraction)
for (const J of [flan, vin4]) {
  const ts = M.termes(J.facteurs.length, 2);
  ts.forEach((t, a) => ts.forEach((u, b) => { if (a < b) proche(M.colonne(J.X, t).reduce((s, v, i) => s + v * M.colonne(J.X, u)[i], 0), 0); }));
}
// fraction E = ABCD : la colonne E est le produit ABCD ; en résolution V, les effets principaux (et interactions d'ordre 2) sont orthogonaux entre eux
M.colonne(vin5.X, [4]).forEach((v, i) => assert.equal(v, M.colonne(vin5.X, [0, 1, 2, 3])[i]));
const t5 = M.termes(5, 2);
t5.forEach((t, a) => t5.forEach((u, b) => { if (a < b) proche(M.colonne(vin5.X, t).reduce((s, v, i) => s + v * M.colonne(vin5.X, u)[i], 0), 0); }));

// flan : coefficients (note et viscosité)
const yn = flan.reponses[0].y, yv = flan.reponses[1].y;
proche(M.moyenneGenerale(yn), 4.3125); proche(M.coefTerme(flan.X, yn, [0]), -1.9375);
const mR = M.moyennes(flan.X, yn, [0]); proche(mR.plus, 2.375); proche(mR.moins, 6.25); proche((mR.plus - mR.moins) / 2, -1.9375);
proche(M.moyenneGenerale(yv), 3397.875); proche(M.coefTerme(flan.X, yv, [1]), 1911.625); proche(M.coefTerme(flan.X, yv, [0, 1]), 726.625);
// modèle à effets principaux pour la note : prévision de l'essai 7 (recette +, T +, refroidissement −)
const f1 = M.ajuste(flan.X, yn, M.termes(3, 1));
proche(M.predit(f1.coefs, f1.ts, [1, 1, -1]), 4.3125 - 1.9375 + 0.1875 + 0.1875); assert.equal(f1.ddl, 4);
// plan complet saturé (8 essais, 8 coefficients) : ddl = 0 et passage exact par les points
const f3 = M.ajuste(flan.X, yn, M.termes(3, 3)); assert.equal(f3.ddl, 0); f3.residus.forEach(r => proche(r, 0, 1e-9)); assert.equal(f3.s, null);
// codage
proche(M.codeDe(95, 75, 102), 6.5 / 13.5); proche(M.reelDe(0, 75, 102), 88.5); proche(M.reelDe(1, 75, 102), 102);
// IC à σ connue
proche(M.demiICsigma(0.5, 8), 1.96 * 0.5 / Math.sqrt(8));

// vinaigrette 2⁴ : Novation = effet principal le plus fort ; interaction Ultratech·Novation négative
const y4 = vin4.reponses[0].y;
proche(M.coefTerme(vin4.X, y4, [3]), 1.7875); proche(M.coefTerme(vin4.X, y4, [2, 3]), -0.825);
const mN = M.moyennes(vin4.X, y4, [3]); proche((mN.plus - mN.moins) / 2, 1.7875);
const full4 = M.ajuste(vin4.X, y4, M.termes(4, 4).filter(t => t.length > 0 && t.length <= 4)); assert.equal(full4.p, 16); assert.equal(full4.ddl, 0);
const red4 = M.ajuste(vin4.X, y4, [[1], [2], [3], [2, 3], [0]]); assert.equal(red4.ddl, 10); assert.ok(red4.r2 > 0.95);

// vinaigrette 2⁵⁻¹ : DE, E, CE, D, C dominent ; 16 coefficients (const + 5 + 10) pour 16 essais → ddl 0
const y5 = vin5.reponses[0].y;
const eff = t5.filter(t => t.length > 0).map(t => [M.nomTerme(t, vin5.facteurs), M.coefTerme(vin5.X, y5, t)]).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
assert.deepEqual(eff.slice(0, 5).map(e => e[0]), ['D·E', 'E', 'C·E', 'D', 'C']);
proche(eff[0][1], -2); proche(eff[1][1], 1.625);
assert.equal(M.ajuste(vin5.X, y5, t5.filter(t => t.length > 0)).ddl, 0);
assert.deepEqual(M.alias([0, 1], 5), [2, 3, 4]); assert.deepEqual(M.alias([0], 5), [1, 2, 3, 4]);
// alias vérifiés numériquement : A·B a la même colonne que C·D·E ; A a la même colonne que B·C·D·E
const mm = (t, u) => M.colonne(vin5.X, t).every((v, i) => v === M.colonne(vin5.X, u)[i]);
assert.ok(mm([0, 1], [2, 3, 4]) && mm([0], [1, 2, 3, 4]) && mm([3, 4], [0, 1, 2]));

// isoréponses : f = x → droite verticale
const s = M.segmentsIso2((x, y) => x, 0.3, 20); assert.ok(s.length > 0); s.forEach(([a, b]) => { proche(a[0], 0.3, 1e-9); proche(b[0], 0.3, 1e-9); });
assert.equal(M.segmentsIso2((x, y) => x, 2, 10).length, 0);
console.log('planFactorielModele : tous les tests passent');
