// Test du modèle de la simulation 158 (savons et amphiphilie) : node src/simulations/savonModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './savonModele.js';

// formules brutes : celles qui sont déclarées doivent être celles que l'analyseur compte sur la formule semi-développée
for (const e of M.ENTITES) {
  if (e.tete !== 'ions') {
    assert.deepEqual(M.brute(e), e.brute, `${e.id} : formule brute ${JSON.stringify(M.brute(e))} ≠ ${JSON.stringify(e.brute)}`);
    assert.equal(M.carbonesChaine(e), e.chaineC, `${e.id} : carbones de la chaîne`);
  }
  // un carboxylate ou un acide : chaîne + 1 carbone (le carbone du groupe COO)
  if (e.tete === 'COO-' || e.tete === 'COOH') assert.equal(M.nbAtomes(e, 'C'), e.chaineC + 1, `${e.id} : C total`);
  // charge de l'ion : les formules sont électriquement cohérentes
  if (e.tete !== 'ions') assert.equal(e.teteTxt.includes('⁻') ? -1 : 0, e.q, `${e.id} : charge`);
}
// valeurs de référence recalculées à part
assert.equal(M.formuleBrute(M.entite('stearate')), 'C₁₈H₃₅O₂');
assert.equal(M.formuleBrute(M.entite('oleate')), 'C₁₈H₃₃O₂');
assert.equal(M.formuleBrute(M.entite('dodecanol')), 'C₁₂H₂₆O');
assert.equal(M.masseMolaire(M.entite('stearate'), { sel: true }), 306.0);   // C18H35O2Na : 216 + 35 + 32 + 23
assert.equal(M.masseMolaire(M.entite('stearate')), 283.0);
assert.equal(M.masseMolaire(M.entite('laurate'), { sel: true }), 222.0);
assert.equal(M.masseMolaire(M.entite('nacl')), 58.5);
// la famille des carboxylates saturés CH₃–(CH₂)ₙ–COO⁻
for (const [n] of M.SERIE) {
  const c = M.carboxylate(n), e = { chaine: `CH₃–(CH₂)${[...String(n)].map(d => '₀₁₂₃₄₅₆₇₈₉'[+d]).join('')}–`, teteTxt: 'COO⁻', tete: 'COO-' };
  assert.equal(c.C, M.compter(M.semi(e)).C); assert.equal(c.H, M.compter(M.semi(e)).H); assert.equal(c.O, 2);
  assert.equal(c.M, c.Manion + 23.0);
}
assert.equal(M.carboxylate(16).M, 306.0); assert.equal(M.carboxylate(14).M, 278.0);
// classement
const cl = id => M.classer(M.entite(id));
for (const id of ['stearate', 'palmitate', 'laurate', 'oleate']) { assert.equal(cl(id).caractere, 'amphiphile', id); assert.ok(cl(id).savon, id); }
assert.equal(cl('acetate').caractere, 'hydrophile'); assert.ok(!cl('acetate').savon);
assert.equal(cl('ethanol').caractere, 'hydrophile'); assert.equal(cl('nacl').caractere, 'hydrophile');
assert.equal(cl('dodecane').caractere, 'lipophile');
for (const id of ['acide-stearique', 'dodecanol']) { assert.equal(cl(id).caractere, 'amphiphile', id); assert.ok(cl(id).faible && !cl(id).savon, id); }
// chaque entité a une justification non vide, sans « undefined » ni double article
for (const e of M.ENTITES) { const j = M.justification(e); assert.ok(j.length > 30 && !/undefined|Un un|un un/.test(j), `${e.id} : ${j}`); }
// milieux : une bonne réponse et trois fausses, de forme comparable
for (const m of M.MILIEUX) assert.equal(m.faux.length, 3, m.id);
console.log('OK : modèle des savons (formules, masses molaires, classement, justifications)');
