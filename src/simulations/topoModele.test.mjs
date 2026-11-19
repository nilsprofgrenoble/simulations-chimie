// node src/simulations/topoModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './topoModele.js';

// 1. noms connus (écrits à la main, indépendants du programme)
const CONNUS = {
  CCCC: 'butane', 'CC(C)C': '2-méthylpropane', 'C=CCC': 'but-1-ène', 'CC=CC': 'but-2-ène', 'C=C(C)C': '2-méthylprop-1-ène', C1CCC1: 'cyclobutane', 'CC1CC1': 'méthylcyclopropane',
  CCCCC: 'pentane', 'CCC(C)C': '2-méthylbutane', 'CC(C)(C)C': '2,2-diméthylpropane', CCCCO: 'butan-1-ol', 'CCC(C)O': 'butan-2-ol', 'CC(C)CO': '2-méthylpropan-1-ol', 'CC(C)(C)O': '2-méthylpropan-2-ol',
  CCCO: 'propan-1-ol', 'CC(O)C': 'propan-2-ol', 'C=CC': 'propène', C1CC1: 'cyclopropane', 'CC(C)CCC': '2-méthylpentane', 'CC(C)C(C)C': '2,3-diméthylbutane', 'C=CCCC': 'pent-1-ène', 'CC=CCC': 'pent-2-ène',
  C1CCCC1: 'cyclopentane', 'C=C(C)CC': '2-méthylbut-1-ène', 'CC(C)=CC': '2-méthylbut-2-ène', CC: 'éthane', 'C=C': 'éthène', CCO: 'éthanol', 'C=CCCO': 'but-3-én-1-ol', 'CCC(C)CC': '3-méthylpentane',
  'CC(C)CC(C)C': '2,4-diméthylpentane', 'CCCC(C)C': '2-méthylpentane', C1CCCC1O: 'cyclopentanol', 'CC1CCC1': 'méthylcyclobutane', 'CCC(CC)CC': '3-éthylpentane', 'CC(C)C=C': '3-méthylbut-1-ène',
  'CC(C)CCO': '3-méthylbutan-1-ol', 'CCC(O)CC': 'pentan-3-ol', 'CC(O)CCC': 'pentan-2-ol',
};
for (const [s, n] of Object.entries(CONNUS)) assert.equal(M.nom(M.lire(s)), n, s);

// 2. formules brutes
const BR = { CCCC: 'C₄H₁₀', 'C=CCC': 'C₄H₈', C1CCC1: 'C₄H₈', CCCCO: 'C₄H₁₀O', CCO: 'C₂H₆O', 'C=C': 'C₂H₄', CC1CC1: 'C₄H₈', C1CCCC1: 'C₅H₁₀', 'CC(C)(C)C': 'C₅H₁₂', CCC: 'C₃H₈' };
for (const [s, f] of Object.entries(BR)) assert.equal(M.bruteTexte(M.lire(s)), f, s);

// 3. semi-développées
const SD = { CCCC: 'CH₃–CH₂–CH₂–CH₃', 'C=CCC': 'CH₂=CH–CH₂–CH₃', 'CC=CC': 'CH₃–CH=CH–CH₃', 'CC(C)C': 'CH₃–CH(CH₃)–CH₃', CCCCO: 'CH₃–CH₂–CH₂–CH₂–OH', 'CCC(C)O': 'CH₃–CH(OH)–CH₂–CH₃',
  'CC(C)(C)O': 'CH₃–C(CH₃)(OH)–CH₃', 'CC(C)(C)C': 'CH₃–C(CH₃)₂–CH₃', 'C=C(C)C': 'CH₂=C(CH₃)–CH₃', 'C=CCCO': 'CH₂=CH–CH₂–CH₂–OH', 'CC(C)CO': 'CH₃–CH(CH₃)–CH₂–OH' };
for (const [s, f] of Object.entries(SD)) assert.equal(M.semiDev(M.lire(s)).texte, f, s);
assert.equal(M.semiDev(M.lire('C1CCC1')).texte, '(CH₂)₄'); assert.ok(M.semiDev(M.lire('C1CCC1')).cycle);
assert.equal(M.semiDev(M.lire('CC1CC1')).texte, 'CH(CH₃)–(CH₂)₂');

// la semi-développée est cohérente avec le graphe : mêmes nombres de C, de H et de O que la formule brute (comptage sur le texte)
function compte(sd) {
  const t = sd.replace(/₀|₁|₂|₃|₄|₅|₆|₇|₈|₉/g, c => '|' + '₀₁₂₃₄₅₆₇₈₉'.indexOf(c) + '|');
  let C = 0, H = 0, O = 0;
  const re = /C(?:H(?:\|(\d)\|)?)?|OH/g; let m;
  const brut = sd.replace(/\)(₂|₃)/g, ')$1');
  // groupes (X)₂ : multiplier
  const rec = s => {
    let c = 0, h = 0, o = 0, i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === 'C') { c++; i++; if (s[i] === 'H') { i++; const k = '₀₁₂₃₄₅₆₇₈₉'.indexOf(s[i]); if (k >= 0) { h += k; i++; } else h += 1; } }
      else if (ch === 'O') { o++; i++; if (s[i] === 'H') { h++; i++; } }
      else if (ch === '(') { let d = 1, j = i + 1; while (d) { if (s[j] === '(') d++; if (s[j] === ')') d--; j++; } const r = rec(s.slice(i + 1, j - 1)); let mult = 1; const k = '₀₁₂₃₄₅₆₇₈₉'.indexOf(s[j]); if (k >= 0) { mult = k; j++; } c += r.c * mult; h += r.h * mult; o += r.o * mult; i = j; }
      else i++;
    }
    return { c, h, o };
  };
  void t; void re; void m; void brut; void C; void H; void O;
  return rec(sd);
}
// 4. espace du constructeur : aucune erreur, noms uniques par molécule, semi-développée cohérente, dessin sans chevauchement, une seule molécule par nom
const parNom = new Map(), parCanon = new Map();
let nbValides = 0;
for (const d of M.descriptions()) {
  const { g, erreur } = M.construire(d);
  if (!g) { assert.ok(erreur && erreur.msg, JSON.stringify(d)); continue; }
  nbValides++;
  assert.ok(M.estValide(g), JSON.stringify(d));
  const nm = M.nom(g), c = M.canon(g);
  if (parNom.has(nm)) assert.equal(parNom.get(nm), c, `deux molécules différentes pour le nom ${nm}`); else parNom.set(nm, c);
  if (parCanon.has(c)) assert.equal(parCanon.get(c), nm, `deux noms pour une même molécule : ${nm}`); else parCanon.set(c, nm);
  const b = M.brute(g), sd = compte(M.semiDev(g).texte);
  assert.deepEqual(sd, { c: b.C, h: b.H, o: b.O }, `${nm} : ${M.semiDev(g).texte}`);
  for (const opt of [{}, { racine: 0 }, { plie: true }]) {
    if (d.type === 'cy' && opt.plie) continue;
    const pts = M.disposition(g, opt);
    assert.ok(pts.every(p => p && isFinite(p.x) && isFinite(p.y)), nm);
    if (!opt.plie) assert.ok(M.distMin(pts) > 0.74, `${nm} : atomes trop proches (${M.distMin(pts).toFixed(2)}) ${JSON.stringify(opt)}`);
  }
  assert.ok(g.at.every((e, i) => e !== 'O' || M.valence(g, i) === 1));
}
console.log('constructeur :', nbValides, 'structures valides,', parNom.size, 'molécules distinctes');

// 5. isomères : dénombrements attendus (écrits à la main)
const ATTENDU = { C3H6: 2, C4H10: 2, C5H12: 3, C3H8O: 2, C4H8: 5, C4H10O: 4 };
for (const [k, n] of Object.entries(ATTENDU)) assert.equal(M.nbIsomeres(k), n, k);
assert.deepEqual(M.isomeres('C4H8').map(x => x.nom).sort(), ['but-1-ène', 'but-2-ène', 'cyclobutane', 'méthylcyclopropane', '2-méthylprop-1-ène'].sort());
assert.deepEqual(M.isomeres('C4H10O').map(x => x.nom).sort(), ['butan-1-ol', 'butan-2-ol', '2-méthylpropan-1-ol', '2-méthylpropan-2-ol'].sort());
// les isomères d'une même formule sont bien deux à deux différents, et jamais isomorphes entre formules
for (const k of M.FORMULES) { const l = M.isomeres(k); l.forEach(a => l.forEach(b => { if (a !== b) assert.ok(M.sontIsomeres(a.g, b.g)); })); }

// 6. même molécule dessinée autrement
const b1 = M.lire('CCCC'), b2 = M.lire('C(C)CC');
assert.ok(M.memeMolecule(b1, b2)); assert.ok(!M.memeMolecule(b1, M.lire('CC(C)C'))); assert.ok(M.sontIsomeres(b1, M.lire('CC(C)C')));
assert.ok(!M.sontIsomeres(b1, M.lire('C=CCC')));
assert.ok(M.memeMolecule(M.lire('CC=CCC'), M.lire('CCC=CC')));          // pent-2-ène lu dans les deux sens
assert.ok(M.memeMolecule(M.lire('OCCCC'), M.lire('CCCCO')));
// variantes de dessin du butane : pliée, miroir, rotation, sans chevauchement
for (const opt of [{ plie: true }, { miroir: true }, { rot: 90 }, { racine: 3 }]) assert.ok(M.distMin(M.disposition(b1, opt)) > 0.99, JSON.stringify(opt));

// 7. relations (défi 2)
const R = (a, b) => M.relation(M.lire(a), M.lire(b));
assert.ok(R('CCCCO', 'CCC(C)O').position); assert.ok(R('CCCCO', 'CC(C)CO').chaine); assert.ok(R('CCCCO', 'CC(C)(C)O').chaine);
assert.ok(R('C=CCC', 'CC=CC').position); assert.ok(R('C=CCC', 'C=C(C)C').chaine); assert.equal(R('C=CCC', 'C1CCC1').autre, true);
assert.equal(R('CCCC', 'CCCC').motif, 'meme'); assert.equal(R('CCCC', 'C=CCC').motif, 'formule');
console.log('topoModele : OK');

// 8. défi 2 : chaque tirage possible a au moins une réponse atteignable avec le constructeur
for (const [smi, kind] of M.POOL_RELATIONS) {
  const ref = M.lire(smi);
  const ok = M.descriptions().some(d => { const { g } = M.construire(d); if (!g) return false; const r = M.relation(ref, g); return r.ok && r[kind === 'position' ? 'position' : 'chaine']; });
  assert.ok(ok, `défi relation sans réponse : ${smi} ${kind}`);
}
console.log('défis : OK');
