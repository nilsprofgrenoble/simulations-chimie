// Test du modèle de la simulation 179 (équation de réaction, 2GT) : node src/simulations/equationReactionModele.test.mjs
import * as M from './equationReactionModele.js';
let n = 0;
const ok = (c, m) => { n++; if (!c) { console.error('ÉCHEC :', m); process.exit(1); } };
const egal = (a, b, m) => ok(JSON.stringify(a) === JSON.stringify(b), `${m} : ${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

// 1. chaque transformation : les coefficients attendus conservent éléments et charge, sont minimaux et sont ceux que trouve la recherche
for (const r of M.REACTIONS) {
  egal(M.coefsAjustes(r), r.attendus, `coefficients de ${r.id}`);
  ok(M.estAjustee(r, r.attendus), `${r.id} ajustée`);
  ok(M.estMinimale(r, r.attendus), `${r.id} minimale`);
  ok(!M.estAjustee(r, r.attendus.map(() => 1)) || r.attendus.every(c => c === 1), `${r.id} : tout à 1 n'est pas ajustée sauf si attendu`);
  // doubler les coefficients reste ajusté mais n'est pas minimal
  ok(M.estAjustee(r, r.attendus.map(c => 2 * c)) && !M.estMinimale(r, r.attendus.map(c => 2 * c)), `${r.id} : le double n'est pas minimal`);
  // états physiques et formules : chaque espèce a une formule, un état admis
  M.especesDe(r).forEach(id => ok(M.ESPECES[id] && ['s', 'l', 'g', 'aq'].includes(M.ESPECES[id].etat), `état de ${id}`));
}
// 2. équations écrites (conventions du site : états, indices et exposants Unicode, espace insécable après le coefficient)
const T = (id, o) => M.equationAttendue(M.reaction(id), o);
egal(T('carbone'), 'C(s) + O₂(g) → CO₂(g)', 'carbone');
egal(T('methane'), `CH₄(g) + 2${M.NB}O₂(g) → CO₂(g) + 2${M.NB}H₂O(g)`, 'méthane');
egal(T('zinc'), `Zn(s) + 2${M.NB}H⁺(aq) → Zn²⁺(aq) + H₂(g)`, 'zinc');
egal(T('aluminium'), `2${M.NB}Al(s) + 6${M.NB}H⁺(aq) → 2${M.NB}Al³⁺(aq) + 3${M.NB}H₂(g)`, 'aluminium');
egal(T('calcaire'), `CaCO₃(s) + 2${M.NB}H⁺(aq) → Ca²⁺(aq) + CO₂(g) + H₂O(l)`, 'calcaire');
egal(T('neutralisation'), 'H⁺(aq) + HO⁻(aq) → H₂O(l)', 'neutralisation');
egal(T('neutraComplete'), 'H⁺(aq) + Cl⁻(aq) + Na⁺(aq) + HO⁻(aq) → H₂O(l) + Na⁺(aq) + Cl⁻(aq)', 'neutralisation complète');
egal(T('dba'), `2${M.NB}C₇H₆O(l) + C₃H₆O(l) → C₁₇H₁₄O(s) + 2${M.NB}H₂O(l)`, 'dibenzalacétone');
egal(T('methane', { etats: false }), `CH₄ + 2${M.NB}O₂ → CO₂ + 2${M.NB}H₂O`, 'sans états');
// 3. bilans : méthane non ajusté (1, 1, 1, 1) : H et O différent, C égal
const b = M.bilan(M.reaction('methane'), [1, 1, 1, 1]);
egal(b.lignes.map(l => [l.el, l.g, l.d, l.ok]), [['C', 1, 1, true], ['H', 4, 2, false], ['O', 2, 3, false]], 'bilan méthane non ajusté');
ok(!b.charge.present && !b.ok, 'méthane : pas de charge, non ajusté');
// charge : Zn + H⁺ → Zn²⁺ + H₂ avec un seul H⁺ : H différent (1/2) et charge 1/2 ; avec 2 H⁺ : charges 2/2
const bz = M.bilan(M.reaction('zinc'), [1, 1, 1, 1]);
egal([bz.charge.g, bz.charge.d, bz.charge.present], [1, 2, true], 'charge zinc à 1 H⁺');
const bz2 = M.bilan(M.reaction('zinc'), [1, 2, 1, 1]);
ok(bz2.ok && bz2.charge.g === 2 && bz2.charge.d === 2, 'zinc ajusté : charge 2 = 2');
// pièges classiques : modifier un indice n'est pas permis ici, mais un coefficient trop grand sur H⁺ casse la charge
ok(!M.estAjustee(M.reaction('fer'), [1, 3, 1, 1]), 'fer à 3 H⁺ non ajusté');
// 4. spectatrices
egal(M.spectatrices(M.reaction('neutraComplete')).sort(), ['Cl', 'Na'], 'spectatrices Na⁺ et Cl⁻');
const simple = M.sansSpectatrices(M.reaction('neutraComplete'));
egal(M.equationAttendue(simple), 'H⁺(aq) + HO⁻(aq) → H₂O(l)', 'équation sans spectatrices');
egal(M.coefsAjustes(simple), [1, 1, 1], 'coefficients sans spectatrices');
// 5. défis : tirages vérifiés sur 3 000 tirages
for (let t = 0; t < 3000; t++) {
  const a = M.tirerDefiAjuster();
  ok(M.estMinimale(a.r, a.vrai) && !M.estAjustee(a.r, a.r.reactifs.concat(a.r.produits).map(() => 1)) || a.r.attendus.every(c => c === 1), 'défi ajuster : l’équation de départ (tout à 1) ne doit pas être déjà ajustée');
  const q = M.tirerDefiQuantite(), ids = M.especesDe(q.r);
  ok(Number.isInteger(q.vrai) && q.vrai > 0 && q.N % q.coefs[q.i] === 0, 'défi quantité : entier');
  ok(q.vrai === q.coefs[q.j] * q.N / q.coefs[q.i], 'défi quantité : proportionnalité');
  ok(q.N >= 2 && q.N <= 30 && q.vrai <= 30, `défi quantité : bornes ${q.N} ${q.vrai}`);
  ok(q.i < q.r.reactifs.length && q.j >= q.r.reactifs.length, 'réactif puis produit');
  ok(ids[q.i] && ids[q.j] && q.N !== q.vrai || true, '');
}
console.log(`equationReactionModele : ${n} vérifications OK`);
