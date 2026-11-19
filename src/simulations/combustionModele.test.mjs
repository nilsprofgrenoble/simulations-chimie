import assert from 'node:assert/strict';
import * as C from './combustionModele.js';

const proche = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
const NB = ' ';
const f = id => C.combustible(id);
// équations équilibrées (atomes C, H, O de chaque côté), pour 1 mol de combustible
for (const c of C.COMBUSTIBLES) {
  const a = C.atomes(c), k = C.coefficients(c);
  assert.ok(proche(a.C, k.CO2) && proche(a.H, 2 * k.H2O) && proche(a.O + 2 * k.O2, 2 * k.CO2 + k.H2O), `équation non équilibrée ${c.f}`);
  assert.ok(Number.isInteger(2 * k.O2), 'coefficient demi-entier');
}
assert.equal(C.equation(f('ch4')), `CH₄ + 2${NB}O₂ → CO₂ + 2${NB}H₂O`);
assert.equal(C.equation(f('c3h8')), `C₃H₈ + 5${NB}O₂ → 3${NB}CO₂ + 4${NB}H₂O`);
assert.equal(C.equation(f('c2h5oh')), `C₂H₅OH + 3${NB}O₂ → 2${NB}CO₂ + 3${NB}H₂O`);
assert.equal(C.equation(f('ch3oh')), `CH₃OH + 1½${NB}O₂ → CO₂ + 2${NB}H₂O`);
assert.equal(C.equation(f('c4h10')), `C₄H₁₀ + 6½${NB}O₂ → 4${NB}CO₂ + 5${NB}H₂O`);
assert.equal(C.equation(f('c8h18')), `C₈H₁₈ + 12½${NB}O₂ → 8${NB}CO₂ + 9${NB}H₂O`);
assert.equal(C.equation(f('c3h7oh')), `C₃H₇OH + 4½${NB}O₂ → 3${NB}CO₂ + 4${NB}H₂O`);
assert.equal(C.coefTexte(0.5), `½${NB}`);
assert.ok(C.estEntiere(f('ch4')) && !C.estEntiere(f('ch3oh')));
// valence : chaque carbone a 4 liaisons, chaque oxygène 2, chaque hydrogène 1 (comptage sur les liaisons de la molécule)
for (const c of C.COMBUSTIBLES) {
  const L = C.liaisonsMolecule(c), a = C.atomes(c);
  assert.equal(L.CH + (L.CC || 0) * 2 + (L.CO || 0), 4 * a.C, `valence C de ${c.f}`);
  assert.equal(L.CH + (L.OH || 0), a.H, `H de ${c.f}`);
  assert.equal((L.CO || 0) + (L.OH || 0), 2 * a.O, `valence O de ${c.f}`);
}
// méthane : 4 C–H + 2 O=O rompues ; 2 C=O + 4 O–H formées ; E_r = 2648 − 3460 = −812 kJ/mol
const ch4 = f('ch4');
assert.deepEqual(C.liaisonsRompues(ch4), { CH: 4, OO: 2 });
assert.deepEqual(C.liaisonsFormees(ch4), { CdO: 2, OH: 4 });
assert.equal(C.energieRompue(ch4), 2648); assert.equal(C.energieFormee(ch4), 3460); assert.equal(C.energieReaction(ch4), -812);
assert.ok(proche(C.masseMolaire(ch4), 16.0) && proche(C.pouvoirCalorifique(ch4), 812 / 16, 1e-9));
// éthanol : 5 C–H, C–C, C–O, O–H + 3 O=O ; 4 C=O + 6 O–H ; E_r = 4728 − 5994 = −1266
const et = f('c2h5oh');
assert.deepEqual(C.liaisonsRompues(et), { CH: 5, CC: 1, CO: 1, OH: 1, OO: 3 });
assert.equal(C.energieRompue(et), 4728); assert.equal(C.energieFormee(et), 5994); assert.equal(C.energieReaction(et), -1266);
assert.ok(proche(C.masseMolaire(et), 46.0));
// propane : −2038 ; butane (1 mol) : −2651 ; octane : −5103 ; méthanol : −653 ; propan-1-ol : −1879
assert.equal(C.energieReaction(f('c3h8')), -2038); assert.equal(C.energieReaction(f('c4h10')), -2651); assert.equal(C.energieReaction(f('c8h18')), -5103);
assert.equal(C.energieReaction(f('ch3oh')), -653); assert.equal(C.energieReaction(f('c3h7oh')), -1879);
// toutes les combustions sont exothermiques, l'estimation reste à moins de 5 % de la référence
for (const c of C.COMBUSTIBLES) { assert.ok(C.energieReaction(c) < 0, `${c.f} exothermique`); assert.ok(C.ecartRelatif(c) < 0.05, `écart ${c.f}`); }
assert.ok(Math.abs(C.ecartRelatif(ch4) - 10 / 802) < 1e-12);
// équation à trous
assert.equal(C.equation(ch4, { cache: ['O2'] }), `CH₄ + …${NB}O₂ → CO₂ + 2${NB}H₂O`);
// défis : toujours un nombre fini et un signe négatif
for (let i = 0; i < 200; i++) { const d = C.tirerDefiEnergie(); assert.ok(d.vrai < 0); const p = C.tirerDefiPouvoir(); assert.ok(p.vrai > 20 && p.vrai < 60); }
console.log('combustionModele : OK');
// dessins : valence correcte, comptage des liaisons identique à celui du modèle
import * as D from './combustionDessin.js';
for (const m of [D.dioxygene(), D.dioxydeCarbone(), D.eau()]) assert.ok(D.valenceOK(m));
assert.deepEqual(D.compteLiaisons(D.dioxygene()), { OO: 1 }); assert.deepEqual(D.compteLiaisons(D.dioxydeCarbone()), { CdO: 2 }); assert.deepEqual(D.compteLiaisons(D.eau()), { OH: 2 });
for (const c of C.COMBUSTIBLES) {
  const m = D.moleculeDe(c);
  if (!m) { assert.ok(c.nC > 4); continue; }
  assert.ok(D.valenceOK(m), `valence du dessin de ${c.f}`);
  const cpt = D.compteLiaisons(m), mod = C.liaisonsMolecule(c);
  for (const t of ['CH', 'CC', 'CO', 'OH']) assert.equal(cpt[t] || 0, mod[t] || 0, `liaisons ${t} de ${c.f}`);
}
console.log('combustionDessin : OK');
