// Vérifie le modèle de nomenclature organique : node src/simulations/organiqueModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './organiqueModele.js';

const { nom, schema, brute, nomDepuisSchema, TOUS, BANQUE, alcane, alcool, aldehyde, cetone, acide, comparerNom, comparerBrute, lireBrute, lineaire, famille } = M;

// ── 1. Noms du cours (page 4, 6, 7, 8, 9) ──
const ssub = (n, ...p) => alcane(n, p.map(([pos, L]) => ({ pos, L })));
const attendus = [
  [alcane(1), 'méthane'], [alcane(2), 'éthane'], [alcane(3), 'propane'], [alcane(4), 'butane'], [alcane(5), 'pentane'], [alcane(6), 'hexane'],
  [ssub(3, [2, 1]), '2-méthylpropane'],                         // cours p. 4
  [ssub(4, [3, 1]), '2-méthylbutane'],                          // exemple a) p. 6, numéroté depuis la droite
  [ssub(5, [3, 1], [4, 1]), '2,3-diméthylpentane'],             // d)
  [ssub(5, [2, 1], [2, 1]), '2,2-diméthylpentane'],             // e) écrit CH3–C(CH3)2–CH2–CH2–CH3
  [ssub(3, [2, 1], [2, 1]), '2,2-diméthylpropane'],             // cours p. 8
  [ssub(6, [3, 1]), '3-méthylhexane'],                          // cours p. 8
  [ssub(5, [2, 1], [3, 2]), '3-éthyl-2-méthylpentane'],
  [ssub(5, [4, 1], [3, 2]), '3-éthyl-2-méthylpentane'],         // même molécule numérotée à l'envers
  [alcool(1), 'méthanol'], [alcool(2), 'éthanol'], [alcool(3, 1), 'propan-1-ol'], [alcool(3, 2), 'propan-2-ol'], [alcool(4, 2), 'butan-2-ol'],
  [alcool(4, 3), 'butan-2-ol'],                                  // numérotation depuis l'autre bout : le plus petit numéro l'emporte
  [aldehyde(1), 'méthanal'], [aldehyde(2), 'éthanal'], [aldehyde(5), 'pentanal'],
  [cetone(3), 'propanone'], [cetone(4), 'butanone'], [cetone(5, 2), 'pentan-2-one'], [cetone(5, 4), 'pentan-2-one'], [cetone(6, 3), 'hexan-3-one'],
  [acide(1), 'acide méthanoïque'], [acide(2), 'acide éthanoïque'], [acide(5), 'acide pentanoïque'],
];
for (const [m, n] of attendus) assert.equal(nom(m), n, `nom de ${JSON.stringify(m)}`);

// ── 2. Le nom retrouvé à partir du DESSIN (méthode du cours) redonne le nom construit, pour toute la banque et dans les deux sens d'écriture ──
for (const m of TOUS) {
  for (const flip of [false, true]) {
    const d = nomDepuisSchema(schema(m, flip));
    assert.equal(d.nom, nom(m), `nom du dessin de ${nom(m)} (retourné : ${flip})`);
    assert.equal(d.longueur, m.n, `chaîne principale de ${nom(m)}`);
  }
}
// noms tous différents (une molécule = un nom)
assert.equal(new Set(TOUS.map(nom)).size, TOUS.length, 'noms en double dans la banque');

// ── 3. Validité chimique du dessin : chaque carbone a 4 liaisons (H compris), oxygène 2, hydrogène 1 ──
for (const m of TOUS) for (const flip of [false, true]) {
  const s = schema(m, flip), somme = new Array(s.noeuds.length).fill(0);
  for (const l of s.liaisons) { somme[l.a] += l.ordre; somme[l.b] += l.ordre; }
  for (const nd of s.noeuds) {
    assert.ok(nd.h >= 0, `${nom(m)} : H négatif sur un ${nd.el}`);
    const valence = { C: 4, O: 2, H: 1 }[nd.el];
    assert.equal(somme[nd.id] + nd.h, valence, `${nom(m)} : valence de ${nd.el} n°${nd.id}`);
    if (nd.el === 'C') assert.ok(nd.h <= 3 || nom(m) === 'méthane');           // seul le méthane a un carbone à 4 H
    if (nd.el === 'H') assert.equal(nd.h, 0);
    // pas de superposition : deux atomes ne partagent jamais la même case
    assert.equal(s.noeuds.filter(x => x.col === nd.col && x.row === nd.row).length, 1, `${nom(m)} : cases superposées`);
  }
  // le dessin est connexe
  const vus = new Set([0]); let ajout = true;
  while (ajout) { ajout = false; for (const l of s.liaisons) if (vus.has(l.a) !== vus.has(l.b)) { vus.add(l.a); vus.add(l.b); ajout = true; } }
  assert.equal(vus.size, s.noeuds.length, `${nom(m)} : dessin non connexe`);
  // les atomes liés sont voisins sur la grille (une liaison ne traverse pas un autre atome)
  for (const l of s.liaisons) { const a = s.noeuds[l.a], b = s.noeuds[l.b]; assert.equal(Math.abs(a.col - b.col) + Math.abs(a.row - b.row), 1, `${nom(m)} : liaison trop longue`); }
}

// ── 3 bis. Dessin « exact » (celui du constructeur) : toute position décrite redonne le bon nom, valences comprises ──
for (let n = 1; n <= 6; n++) for (const flip of [false, true]) {
  const cas = [];
  for (let p = 1; p <= n; p++) cas.push(alcool(n, p));
  for (let p = 2; p < n; p++) cas.push(cetone(n, p));
  cas.push(aldehyde(n), acide(n), alcane(n));
  for (const m of cas) {
    const s = schema(m, flip, true), somme = new Array(s.noeuds.length).fill(0);
    for (const l of s.liaisons) { somme[l.a] += l.ordre; somme[l.b] += l.ordre; }
    for (const nd of s.noeuds) assert.equal(somme[nd.id] + nd.h, { C: 4, O: 2, H: 1 }[nd.el]);
    assert.equal(nomDepuisSchema(s).nom, nom(m), `dessin exact de ${JSON.stringify(m)} (retourné : ${flip})`);
    for (const l of s.liaisons) { const a = s.noeuds[l.a], b = s.noeuds[l.b]; assert.equal(Math.abs(a.col - b.col) + Math.abs(a.row - b.row), 1); }
  }
}
// un substituant éthyle en position 2 d'une chaîne de 4 C allonge la chaîne : le dessin se nomme alors d'après la vraie chaîne principale
const faux = nomDepuisSchema(schema(ssub(4, [2, 2]), false, true));
assert.equal(faux.nom, '3-méthylpentane'); assert.equal(faux.longueur, 5);
// 2-méthylbutane écrit avec le méthyle en position 3 (numérotation « à l'envers ») : même molécule
assert.equal(nomDepuisSchema(schema(ssub(4, [3, 1]), true, true)).nom, '2-méthylbutane');

// ── 4. Formules brutes, calculées autrement (CnH2n+2, CnH2nO, CnH2nO2…) ──
for (const m of TOUS) {
  const b = brute(m), C = M.nbCarbones(m), fam = famille(m).cle;
  assert.equal(b.C, C, `${nom(m)} : nombre de C`);
  const H = { alcane: 2 * C + 2, alcool: 2 * C + 2, aldehyde: 2 * C, cetone: 2 * C, acide: 2 * C }[fam];
  const O = { alcane: 0, alcool: 1, aldehyde: 1, cetone: 1, acide: 2 }[fam];
  assert.deepEqual(b, { C, H, O }, `${nom(m)} : formule brute`);
}
assert.deepEqual(brute(alcane(3)), { C: 3, H: 8, O: 0 });            // propane C3H8
assert.deepEqual(brute(alcool(2)), { C: 2, H: 6, O: 1 });            // éthanol C2H6O
assert.deepEqual(brute(acide(2)), { C: 2, H: 4, O: 2 });             // acide éthanoïque C2H4O2
assert.deepEqual(brute(cetone(3)), { C: 3, H: 6, O: 1 });            // propanone C3H6O
assert.equal(M.brUnicode(cetone(4)), 'C₄H₈O');

// ── 5. Écriture linéaire de la formule semi-développée ──
assert.equal(lineaire(alcane(4)), 'CH₃–CH₂–CH₂–CH₃');
assert.equal(lineaire(ssub(3, [2, 1])), 'CH₃–CH(CH₃)–CH₃');
assert.equal(lineaire(ssub(5, [2, 1], [2, 1])), 'CH₃–C(CH₃)(CH₃)–CH₂–CH₂–CH₃');
assert.equal(lineaire(alcool(3, 1)), 'CH₃–CH₂–CH₂–OH');
assert.equal(lineaire(alcool(3, 2)), 'CH₃–CH(OH)–CH₃');
assert.equal(lineaire(alcool(1)), 'CH₃–OH');
assert.equal(lineaire(cetone(4)), 'CH₃–CO–CH₂–CH₃');
assert.equal(lineaire(aldehyde(2)), 'CH₃–CHO');
assert.equal(lineaire(aldehyde(1)), 'HCHO');
assert.equal(lineaire(acide(2)), 'CH₃–COOH');
assert.equal(lineaire(acide(1)), 'HCOOH');
assert.equal(lineaire(aldehyde(5)), 'CH₃–CH₂–CH₂–CH₂–CHO');

// ── 6. Familles et groupes caractéristiques ──
assert.equal(famille(alcool(3, 2)).groupe.nom, 'hydroxyle');
assert.equal(famille(aldehyde(2)).groupe.nom, 'carbonyle');
assert.equal(famille(cetone(3)).groupe.nom, 'carbonyle');
assert.equal(famille(acide(2)).groupe.nom, 'carboxyle');
assert.equal(famille(alcane(3)).groupe, null);
assert.equal(famille(cetone(3)).nom, 'cétone');

// ── 7. Vérification des saisies ──
assert.equal(comparerNom('2-méthylbutane', ssub(4, [2, 1])), 'ok');
assert.equal(comparerNom('2-METHYLBUTANE', ssub(4, [2, 1])), 'ok');                // accents et casse tolérés
assert.equal(comparerNom('2 méthylbutane', ssub(4, [2, 1])), 'ponctuation');       // tiret oublié
assert.equal(comparerNom('2-méthylbutan', ssub(4, [2, 1])), 'faux');
assert.equal(comparerNom('3-méthylbutane', ssub(4, [2, 1])), 'faux');
assert.equal(comparerNom('Propanone', cetone(3)), 'ok');
assert.equal(comparerNom('propan-2-one', cetone(3)), 'ok');
assert.equal(comparerNom('butan-2-one', cetone(4)), 'ok');
assert.equal(comparerNom('acide ethanoique', acide(2)), 'ok');
assert.equal(comparerNom('acideéthanoïque', acide(2)), 'ponctuation');
assert.equal(comparerNom('éthanoïque', acide(2)), 'faux');
assert.equal(comparerNom('3-éthyl-2-méthylpentane', ssub(5, [2, 1], [3, 2])), 'ok');
assert.equal(comparerNom('2-méthyl-3-éthylpentane', ssub(5, [2, 1], [3, 2])), 'faux');
assert.equal(comparerNom('', acide(2)), 'faux');
assert.ok(comparerBrute('C3H8', alcane(3)) && comparerBrute('c3 h8', alcane(3)) && comparerBrute('C₃H₈', alcane(3)) && comparerBrute('H8C3', alcane(3)));
assert.ok(!comparerBrute('C3H6', alcane(3)) && !comparerBrute('C3H8O', alcane(3)) && !comparerBrute('propane', alcane(3)) && !comparerBrute('', alcane(3)));
assert.deepEqual(lireBrute('C2H6O'), { C: 2, H: 6, O: 1 });
assert.equal(lireBrute('C2H6X'), null);

// ── 8. Fausses réponses : jamais la bonne, jamais un nom accepté, sans doublon ──
for (const m of TOUS) {
  const bad = M.mauvaisNoms(m);
  assert.ok(bad.length >= 2, `${nom(m)} : au moins 2 fausses réponses (${bad.length})`);
  for (const [x, raison] of bad) {
    assert.ok(raison && raison.length > 10, `${nom(m)} : raison manquante pour ${x}`);
    assert.equal(comparerNom(x, m), 'faux', `${nom(m)} : « ${x} » ne doit pas être accepté`);
  }
  assert.equal(new Set(bad.map(b => b[0])).size, bad.length);
}
// molécules proches : différentes de la molécule, du même programme
for (const m of TOUS) {
  const pr = M.moleculesProches(m);
  assert.ok(pr.length >= 2, `${nom(m)} : au moins 2 molécules proches (${pr.length})`);
  for (const x of pr) assert.notEqual(nom(x), nom(m));
}

// ── 9. Contenu de la banque ──
assert.ok(BANQUE.lineaires.length === 6 && BANQUE.ramifies.length >= 12, `banque : ${BANQUE.lineaires.length} linéaires, ${BANQUE.ramifies.length} ramifiés`);
assert.equal(BANQUE.alcools.length, 1 + 1 + 2 + 2 + 3 + 3);
assert.equal(BANQUE.cetones.length, 1 + 1 + 2 + 2);
assert.equal(BANQUE.aldehydes.length, 6); assert.equal(BANQUE.acides.length, 6);
// toutes les chaînes principales ont au plus 6 carbones et aucun substituant n'est plus long qu'un éthyle
for (const m of BANQUE.ramifies) { assert.ok(m.n <= 6 && m.subs.length <= 2 && m.subs.every(s => s.L <= 2)); }
console.log(`OK : ${TOUS.length} molécules (${BANQUE.lineaires.length} linéaires, ${BANQUE.ramifies.length} ramifiées, ${M.avecGroupe.length} à groupe caractéristique)`);
