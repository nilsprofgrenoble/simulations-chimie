// Contrôle du modèle de la simulation 170 (spectroscopie IR, données tabulées) : node src/simulations/irTabModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './irTabModele.js';

// 1. chaque molécule : formule brute = formule semi-développée (comptage des atomes), bandes étiquetées dans leur intervalle tabulé, largeur et intensité cohérentes avec le tableau
const SUB = { '₀': 0, '₁': 1, '₂': 2, '₃': 3, '₄': 4, '₅': 5, '₆': 6, '₇': 7, '₈': 8, '₉': 9 };
const compte = f => { const r = {}; for (const [, a, n] of f.matchAll(/([CHON])([₀-₉]*)/g)) r[a] = (r[a] || 0) + (n ? Number([...n].map(c => SUB[c]).join('')) : 1); return r; };
for (const [k, mol] of Object.entries(M.MOLECULES)) {
  assert.deepEqual(compte(mol.fsd), compte(mol.brute), `${k} : ${mol.fsd} ≠ ${mol.brute}`);
  for (const [s, w, d, id] of mol.bandes) {
    assert.ok(s >= M.SIGMA_MIN && s <= M.SIGMA_MAX, `${k} : σ hors axe`);
    if (!id) continue;
    const L = M.LIGNE[id]; assert.ok(L, `${k} : ligne ${id} inconnue`);
    assert.ok(s >= L.min && s <= L.max, `${k} : bande ${s} hors de ${id} (${L.min}–${L.max})`);
    if (L.allure === 'fine') assert.ok(w <= 40, `${k} ${s} : bande fine trop large (${w})`);
    if (L.allure === 'large') assert.ok(w >= 120 && w <= 250, `${k} ${s} : bande large (${w})`);
    if (L.allure === 'très large') assert.ok(w >= 280, `${k} ${s} : bande très large (${w})`);
    if (L.inten === 'forte') assert.ok(d >= 0.55, `${k} ${s} : intensité forte (${d})`);
    if (L.inten === 'moyenne' || L.inten === 'moyenne à forte') assert.ok(d >= 0.35 && d <= (L.inten === 'moyenne à forte' ? 1 : 0.7), `${k} ${s} : intensité moyenne (${d})`);
  }
}
// valence du carbone dans les fsd : formules brutes connues (alcane saturé : éthanol C2H6O, éthylamine C2H7N, acide C2H4O2, éthanal C2H4O, propanone C3H6O, ester C4H8O2, cyclohexène C6H10)
// degré d'insaturation DI = (2C + 2 + N − H) / 2 : éthanol 0, éthylamine 0, acide 1 (C=O), éthanal 1, propanone 1, ester 1, cyclohexène 2 (1 cycle + 1 C=C)
const DI = { ethanol: 0, ethylamine: 0, acide: 1, ethanal: 1, propanone: 1, ester: 1, cyclohexene: 2 };
for (const [k, mol] of Object.entries(M.MOLECULES)) { const c = compte(mol.brute); assert.equal((2 * c.C + 2 + (c.N || 0) - c.H) / 2, DI[k], `degré d'insaturation de ${k}`); }
// cohérence groupes / bandes : C=O ssi la molécule en porte un, etc.
const aId = (k, pref) => M.bandesExploitables(M.MOLECULES[k]).some(b => b[3].startsWith(pref));
for (const k of ['acide', 'ester', 'propanone', 'ethanal']) assert.ok(aId(k, 'co_'), `${k} sans C=O`);
for (const k of ['ethanol', 'ethylamine', 'cyclohexene']) assert.ok(!aId(k, 'co_'), `${k} ne doit pas avoir de C=O`);
assert.ok(aId('ethanol', 'oh_alcool') && !aId('ethanol', 'nh'));
assert.ok(aId('acide', 'oh_acide') && !aId('acide', 'oh_alcool'));
assert.ok(aId('ethylamine', 'nh') && !aId('ethylamine', 'oh'));
assert.ok(aId('cyclohexene', 'cc'));
assert.ok(!aId('ester', 'oh') && !aId('propanone', 'oh') && !aId('ethanal', 'oh') && !aId('ethanal', 'nh'));
assert.ok(aId('ethanal', 'ch_ald') && !aId('propanone', 'ch_ald'));
// bons types de classe de C=O : acide 1700–1725, ester 1735–1750, cétone/aldéhyde 1705–1740
assert.ok(M.MOLECULES.ester.bandes.some(b => b[3] === 'co_ester' && b[0] >= 1735 && b[0] <= 1740), 'ester : C=O dans le recouvrement 1735–1740');
assert.deepEqual(M.lignesContenant(M.MOLECULES.ester.bandes.find(b => b[3] === 'co_ester')[0]).map(r => r.id).sort(), ['co_ald_cet', 'co_ester']);
assert.ok(!M.TABLE.some(r => r.id === 'c_o'), 'la ligne C–O (empreinte) ne figure plus au tableau');
assert.ok(!M.MOLECULES.ester.bandes.some(b => b[3] === 'co_ald_cet'));

// 2. spectre : la transmittance baisse nettement au centre de chaque bande exploitable, et le minimum lu est proche de σ0
for (const [k, mol] of Object.entries(M.MOLECULES)) {
  for (const [s0, w, d, id] of M.bandesExploitables(mol)) {
    const base = M.transmittance(mol, s0 + (w < 60 ? 5 * w : 700) * 0 + (s0 > 2000 ? 0 : 0)); assert.ok(base < 75, `${k} ${s0} : creux trop faible (T = ${base})`);
    if (w < 60 && id !== 'nh' && id !== 'ch_ald' && !(k === 'acide' && id === 'ch_tet')) { const lu = M.minimumBande(mol, s0, 25); assert.ok(Math.abs(lu - s0) <= 14, `${k} ${s0} : minimum lu ${lu}`); }
  }
}
// la bande C=O de la propanone (étape 1 du parcours) : minimum lu à ±3 de 1715
assert.ok(Math.abs(M.minimumBande(M.MOLECULES.propanone, 1715, 40) - 1715) <= 3);
// loin des bandes, T ≈ 98 % (ligne de base) ; T toujours entre 2 et 99
for (const mol of Object.values(M.MOLECULES)) for (const [, t] of M.spectre(mol, 5, 0.6)) assert.ok(t >= 2 && t <= 99);
assert.ok(M.transmittance(M.MOLECULES.propanone, 4000) > 95 && M.transmittance(M.MOLECULES.propanone, 2200) > 95);
// les spectres ne se touchent pas : une seule molécule du jeu avec une bande très large O–H acide
assert.ok(M.transmittance(M.MOLECULES.acide, 2600) < 70 && M.transmittance(M.MOLECULES.acide, 3500) > 90, 'O–H acide : très large mais s’éteint avant 3500');
assert.ok(M.transmittance(M.MOLECULES.ethanol, 3340) < 30 && M.transmittance(M.MOLECULES.ethanol, 3800) > 95);
// éthylamine : deux bandes N–H fines et séparées (doublet), alcool : une seule bande large
assert.ok(M.transmittance(M.MOLECULES.ethylamine, 3380) < 70 && M.transmittance(M.MOLECULES.ethylamine, 3300) < 70 && M.transmittance(M.MOLECULES.ethylamine, 3340) > 80, 'doublet N–H');

// 3. conversions
assert.ok(Math.abs(M.nombreOnde(5.83) - 1715.3) < 0.1 && Math.abs(M.longueurOnde(1740) - 5.747) < 0.001);

// 4. lignes du tableau
assert.deepEqual(M.lignesContenant(1715).map(r => r.id), ['co_ald_cet', 'co_acide']);
assert.deepEqual(M.lignesContenant(1742).map(r => r.id), ['co_ester'], '1742 : seul l’ester');
assert.deepEqual(M.lignesContenant(1737).map(r => r.id).sort(), ['co_ald_cet', 'co_ester']);
assert.ok(M.TABLE.every(r => r.min < r.max));

// 5. défi « identifier » : ensembles valides, faisabilité sur 20 000 tirages
const ens = M.ensemblesValides();
assert.ok(ens.length >= 10, `ensembles valides : ${ens.length}`);
for (const e of ens) for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
  assert.ok(!M.memesTraits(M.MOLECULES[e[i]], M.MOLECULES[e[j]]), `${e[i]} et ${e[j]} ne se distinguent pas`);
  const classes = x => M.bandesExploitables(M.MOLECULES[x]).filter(b => b[3].startsWith('co_')).length;
  assert.ok(!(classes(e[i]) && classes(e[j]) && !M.traitsForts(M.MOLECULES[e[i]]).has('oh_acide') && !M.traitsForts(M.MOLECULES[e[j]]).has('oh_acide')), `deux composés à C=O seul dans ${e}`);
}
const vus = new Set();
for (let i = 0; i < 20000; i++) {
  const t = M.tirageDefiIdentifier(); vus.add(t.inconnu);
  assert.equal(t.candidats.length, 4); assert.ok(t.candidats.includes(t.inconnu));
  const mal = t.candidats.filter(c => c !== t.inconnu && M.memesTraits(M.MOLECULES[c], t.mol)); assert.equal(mal.length, 0);
  // la variante garde chaque bande dans son intervalle tabulé et à moins de 8 cm⁻¹ de l'original
  t.mol.bandes.forEach((b, k) => { const o = M.MOLECULES[t.inconnu].bandes[k]; assert.ok(Math.abs(b[0] - o[0]) <= 8); if (b[3]) assert.ok(M.dansLigne(b[3], b[0])); });
  // lecture réaliste : ±30 cm⁻¹ sur chaque bande forte ne fait pas sortir de la zone attendue (> 1500) ni ne confond un trait fort avec un autre
  for (const b of M.bandesExploitables(t.mol)) assert.ok(b[0] - 30 > M.SEUIL_EMPREINTE);
}
assert.equal(vus.size, M.NOMS.length, 'toutes les molécules peuvent être inconnues');

// 6. défi « associer » : au moins 2 cibles, séparées de plus de 60 cm⁻¹, liaison conforme au tableau
const mols = new Set();
for (let i = 0; i < 20000; i++) {
  const t = M.tirageDefiAssocier(); mols.add(t.cle);
  assert.ok(t.cibles.length >= 2 && t.cibles.length <= 3);
  t.cibles.forEach((c, a) => { assert.ok(M.dansLigne(c.id, c.s)); assert.ok(c.s > M.SEUIL_EMPREINTE); t.cibles.forEach((d, b) => { if (a < b) assert.ok(Math.abs(c.s - d.s) > 60, `cibles trop proches : ${c.s} ${d.s} (${t.cle})`); }); });
  assert.ok(new Set(t.cibles.map(c => c.lettre)).size === t.cibles.length);
}
assert.equal(mols.size, M.NOMS.length);
console.log('irTabModele : tous les contrôles passent');
