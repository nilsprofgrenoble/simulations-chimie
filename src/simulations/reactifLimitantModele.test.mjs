// Tests du modèle « Réactif limitant » (2GT) : node src/simulations/reactifLimitantModele.test.mjs
import assert from 'node:assert/strict';
import { REACTIONS, reactionDe, equationTexte, conservation, recettes, bilan, etatApres, peutFaire, verifierBilan,
  melangeAvecLimitant, melangeStoechio, energieRelative, arrondi } from './reactifLimitantModele.js';

// 1. Équations exactes et conservation des éléments et de la charge
assert.equal(equationTexte(reactionDe('sandwich')), '2 pain + jambon → sandwich');
assert.equal(equationTexte(reactionDe('methane')), 'CH₄ + 2 O₂ → CO₂ + 2 H₂O');
assert.equal(equationTexte(reactionDe('calcaire')), 'CaCO₃ + 2 H⁺ → Ca²⁺ + CO₂ + H₂O');
assert.equal(equationTexte(reactionDe('dba')), '2 C₇H₆O + C₃H₆O → C₁₇H₁₄O + 2 H₂O');
for (const r of REACTIONS) assert.ok(conservation(r).ok, `${r.id} : équation non équilibrée ${JSON.stringify(conservation(r).diff)}`);
// l'outil détecte bien une équation fausse
const fausse = structuredClone(reactionDe('methane')); fausse.reactifs[1].coef = 1;
assert.equal(conservation(fausse).ok, false);

// 2. Exemples du parcours
let b = bilan(reactionDe('sandwich'), [6, 4]);
assert.deepEqual([b.rmin, b.limitants, b.restes, b.produits], [3, [0], [0, 1], [3]]);                // 6 pains, 4 jambons : 3 sandwichs, pain limitant, 1 jambon restant
b = bilan(reactionDe('sandwich'), [10, 4]);
assert.deepEqual([b.rmin, b.limitants, b.restes], [4, [1], [2, 0]]);                                  // étape « méthode » : 10 pains, 4 jambons
b = bilan(reactionDe('sandwich'), [4, 2]);
assert.deepEqual([b.rmin, b.stoechio, b.produits], [2, true, [2]]);
b = bilan(reactionDe('methane'), [5, 6]);
assert.deepEqual([b.rmin, b.limitants, b.restes, b.produits], [3, [1], [2, 0], [3, 6]]);               // exemple résolu : O₂ limitant
b = bilan(reactionDe('methane'), [2, 5]);
assert.deepEqual([b.rec, b.limitants, b.restes, b.produits], [[2, 2.5], [0], [0, 1], [2, 4]]);         // à vous : CH₄ limitant, 1,0 mol d’O₂ restant
b = bilan(reactionDe('calcaire'), [0.04, 0.06]);
assert.deepEqual([b.limitants, b.restes, b.produits], [[1], [0.01, 0], [0.03, 0.03, 0.03]]);           // H⁺ limitant, il reste 0,010 mol de calcaire
b = bilan(reactionDe('dba'), [0.06, 0.04]);
assert.deepEqual([b.rec, b.limitants, b.restes, b.produits], [[0.03, 0.04], [0], [0, 0.01], [0.03, 0.06]]);   // benzaldéhyde limitant, 0,010 mol d’acétone restant
b = bilan(reactionDe('methane'), [4, 8]);
assert.deepEqual([b.limitants, b.stoechio, b.energie], [[0, 1], true, 4]);
assert.equal(energieRelative(reactionDe('methane'), [2, 8]), 2);                                         // énergie proportionnelle au limitant
assert.equal(energieRelative(reactionDe('methane'), [4, 8]), 4);
assert.equal(energieRelative(reactionDe('methane'), [3, 8]) / energieRelative(reactionDe('methane'), [1, 8]), 3);
assert.equal(energieRelative(reactionDe('methane'), [2, 8]), energieRelative(reactionDe('methane'), [2, 6]));   // O₂ en excès : en ajouter ne change rien
assert.equal(energieRelative(reactionDe('dba'), [1, 1]), null);
b = bilan(reactionDe('calcaire'), [0.02, 0.07]);
assert.deepEqual([b.limitants, b.restes, b.produits], [[0], [0, 0.03], [0.02, 0.02, 0.02]]);           // étape « calcmol » : calcaire limitant, il reste 0,030 mol de H⁺
b = bilan(reactionDe('calcaire'), [0.05, 0.06]);
assert.deepEqual([b.rec, b.restes], [[0.05, 0.03], [0.02, 0]]);                                          // exemple résolu : il reste 0,020 mol de calcaire
b = bilan(reactionDe('dba'), [0.08, 0.03]);
assert.deepEqual([b.rec, b.limitants, b.restes], [[0.04, 0.03], [1], [0.02, 0]]);                        // exemple de l'étape DBA : 0,020 mol de benzaldéhyde restant

// 2 bis. Pas de 0,01 recette (calcaire, DBA : quantités en centièmes de mole) : le bouton « Faire … recette » de l'exploration
for (const [id, n] of [['calcaire', [0.04, 0.06]], ['dba', [0.06, 0.04]], ['methane', [3, 4]]]) {
  const r = reactionDe(id), pas = r.jeton, rmin = bilan(r, n).rmin; let k = 0, clics = 0;
  assert.ok(peutFaire(r, n, 0, pas), `${id} : le premier pas doit être possible`);
  while (peutFaire(r, n, k, pas)) { k = arrondi(k + pas); clics++; assert.ok(clics < 100); }
  assert.ok(Math.abs(k - rmin) < 1e-9 && !peutFaire(r, n, rmin, pas), `${id} : les clics doivent mener au limitant épuisé (k=${k}, rmin=${rmin})`);
}
assert.equal(peutFaire(reactionDe('calcaire'), [0.04, 0.06], 0), false);                                   // sans pas : une recette entière est impossible (ancien bug du bouton)

// 3. Pas à pas
const m = reactionDe('sandwich');
assert.ok(peutFaire(m, [6, 4], 0) && peutFaire(m, [6, 4], 2) && !peutFaire(m, [6, 4], 3));
assert.deepEqual(etatApres(m, [6, 4], 2), { reactifs: [2, 2], produits: [2] });

// 4. Invariants sur de nombreux états (éléments et charge conservés, réactif limitant épuisé)
for (const r of REACTIONS) {
  for (let t = 0; t < 4000; t++) {
    const n = r.reactifs.map(e => arrondi(Math.round(Math.random() * 40) / 4 * r.jeton * (e.max ? 1 : 1)));
    if (n.some(x => x <= 0)) continue;
    const err = verifierBilan(r, n);
    assert.deepEqual(err, [], `${r.id} ${JSON.stringify(n)} : ${err}`);
    // le limitant est bien celui du plus petit n/coef, quelle que soit l'écriture
    const rec = recettes(r, n); const i = rec.indexOf(Math.min(...rec));
    assert.ok(bilan(r, n).limitants.includes(i));
  }
}
// 5. Tirages construits : jamais de mélange stœchiométrique, limitant attendu, reste = e jetons
for (const r of REACTIONS) for (let iLim = 0; iLim < 2; iLim++) for (let mm = 1; mm <= 3; mm++) for (let e = 1; e <= 2; e++) {
  const n = melangeAvecLimitant(r, iLim, mm, e), bb = bilan(r, n);
  assert.deepEqual(bb.limitants, [iLim]);
  assert.equal(bb.restes[1 - iLim], arrondi(e * r.jeton));
  assert.equal(bb.rmin, arrondi(mm * r.jeton));
}
for (const r of REACTIONS) assert.ok(bilan(r, melangeStoechio(r, 2)).stoechio);
console.log('OK : modèle du réactif limitant');
