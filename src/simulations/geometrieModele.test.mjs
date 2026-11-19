// Test du modèle « Géométrie, électronégativité et polarité » : node src/simulations/geometrieModele.test.mjs
// Valeurs attendues écrites À PART (jamais recalculées avec les fonctions testées) : géométrie, angles, polarité de chaque entité.
import assert from 'node:assert/strict';
import * as M from './geometrieModele.js';

const proche = (a, b, tol) => Math.abs(a - b) <= tol;
// id : [AXnEm, forme, angle X–A–X attendu (°), tolérance, polaire (true/false/null si ion), nb de liaisons polarisées, G⁺ = G⁻ ?]
const ATTENDU = {
  H2: [null, 'linéaire', 180, 0.01, false, 0],
  O2: [null, 'linéaire', 180, 0.01, false, 0],
  N2: [null, 'linéaire', 180, 0.01, false, 0],
  HCl: [null, 'linéaire', 180, 0.01, true, 1],
  H2O: ['AX₂E₂', 'coudée', 104.5, 0.01, true, 2],
  CO2: ['AX₂E₀', 'linéaire', 180, 0.01, false, 2],
  NH3: ['AX₃E₁', 'pyramidale', 107, 0.01, true, 3],
  CH4: ['AX₄E₀', 'tétraédrique', 109.47, 0.02, false, 0],
  'H3O+': ['AX₃E₁', 'pyramidale', 110, 0.01, null, 3],
  'NH4+': ['AX₄E₀', 'tétraédrique', 109.47, 0.02, null, 4],
  CCl4: ['AX₄E₀', 'tétraédrique', 109.47, 0.02, false, 4],
  CH3Cl: ['AX₄E₀', 'tétraédrique', 109.47, 0.02, true, 1],
  CH2O: ['AX₃E₀', 'trigonale plane', 120, 0.01, true, 1],
  HCN: ['AX₂E₀', 'linéaire', 180, 0.01, true, 1],
};
assert.equal(M.ENTITES.length, Object.keys(ATTENDU).length, 'une entité sans valeur attendue');
const ZVAL = { H: 1, C: 4, N: 5, O: 6, Cl: 7 };
for (const e of M.ENTITES) {
  const [axe, forme, ang, tol, polaire, nPol] = ATTENDU[e.id];
  assert.equal(M.notationAXE(e), axe, `${e.id} : notation`);
  assert.equal(e.forme, forme, `${e.id} : forme`);
  const a = M.angleXAX(e);
  assert.ok(proche(a, ang, tol), `${e.id} : angle ${a} ≠ ${ang}`);
  if (e.centre != null) assert.equal(M.formeDe(e.n, e.m), forme, `${e.id} : règle (n, m) → forme`);
  const P = M.polarite(e);
  assert.equal(P.polaire, polaire, `${e.id} : polarité`);
  assert.equal(P.nPolarisees, nPol, `${e.id} : nombre de liaisons polarisées`);
  // schéma de Lewis cohérent : chaque atome (hors H) a 4 doublets (octet), H a 1 liaison ; charges formelles = charge de l'entité
  let charge = 0;
  e.atomes.forEach((at, i) => {
    const ordres = e.liaisons.filter(([x, y]) => x === i || y === i).reduce((s, l) => s + l[2], 0);
    if (at.s === 'H') { assert.equal(ordres, 1, `${e.id} : H doit avoir 1 liaison`); assert.equal(at.lp, 0); }
    else assert.equal(ordres + at.lp, 4, `${e.id} : octet de ${at.s}`);
    charge += ZVAL[at.s] - (2 * at.lp + ordres);
  });
  assert.equal(charge, e.charge, `${e.id} : charge formelle totale`);
  // schéma plat : autant de positions que d'atomes, autant de listes de doublets que d'atomes, bon nombre de doublets par atome
  assert.equal(e.lewis.pos.length, e.atomes.length, `${e.id} : positions de Lewis`);
  e.atomes.forEach((at, i) => assert.equal(e.lewis.lpDirs[i].length, at.lp, `${e.id} : doublets dessinés sur ${at.s}${i}`));
}

// distances et angles réels des entités à atome central : tous les ligands à la même distance de leur type
assert.ok(proche(M.angleXAX(M.entite('H2O')), 104.5, 0.01));
// barycentres : valeurs attendues à la main
{
  const co2 = M.polarite(M.entite('CO2')), h2o = M.polarite(M.entite('H2O'));
  assert.ok(co2.norme < 1e-9, 'CO₂ : G⁺ = G⁻');
  assert.ok(proche(h2o.Gmoins[0], 0, 1e-9) && proche(h2o.Gmoins[1], 0, 1e-9), 'H₂O : G⁻ sur O');
  assert.ok(proche(h2o.Gplus[1], -0.96 * Math.cos(52.25 * Math.PI / 180), 1e-3), 'H₂O : G⁺ au milieu des deux H');
  assert.ok(h2o.moment[1] < 0 && proche(h2o.norme, 0.96 * Math.cos(52.25 * Math.PI / 180), 1e-3), 'moment dipolaire de H₂O : de G⁻ (O) vers G⁺ (côté des H)');
}

// Δχ et classement (valeurs écrites à la main, seuils conventionnels 0,4 et 1,7)
const DCHI = { 'H-H': [0, 'non'], 'C-H': [0.3, 'non'], 'N-H': [0.8, 'pol'], 'O-H': [1.3, 'pol'], 'H-Cl': [0.8, 'pol'], 'C-O': [1.0, 'pol'], 'C-Cl': [0.5, 'pol'], 'C-N': [0.5, 'pol'], 'Na-Cl': [2.1, 'ion'], 'C-C': [0, 'non'], 'Cl-Cl': [0, 'non'] };
for (const [k, [d, t]] of Object.entries(DCHI)) {
  const [a, b] = k.split('-');
  assert.equal(M.deltaChi(a, b), d, `Δχ ${k}`);
  assert.equal(M.deltaChi(b, a), d, `Δχ ${k} symétrique`);
  assert.equal(M.typeLiaison(M.deltaChi(a, b)), t, `type ${k}`);
}
// aucune paire utilisée ne tombe pile sur un seuil (0,4 ou 1,7) : le classement ne dépend pas de la convention d'égalité
const ats = Object.keys(M.CHI);
for (const a of ats) for (const b of ats) { const d = M.deltaChi(a, b); assert.ok(d !== 0.4 && d !== 1.7 || ['F', 'Br', 'S'].includes(a) || ['F', 'Br', 'S'].includes(b), `${a}-${b} sur un seuil`); }
assert.equal(M.typeLiaison(0.4), 'non'); assert.equal(M.typeLiaison(0.5), 'pol'); assert.equal(M.typeLiaison(1.8), 'ion');

// charges partielles : O de H₂O porte −2 (deux liaisons), chaque H +1 ; C de CO₂ porte +2
assert.deepEqual(M.chargesPartielles(M.entite('H2O')), [-2, 1, 1]);
assert.deepEqual(M.chargesPartielles(M.entite('CO2')), [2, -1, -1]);
assert.deepEqual(M.chargesPartielles(M.entite('CH4')), [0, 0, 0, 0, 0]);
// somme des charges partielles nulle pour toute entité
for (const e of M.ENTITES) assert.equal(M.chargesPartielles(e).reduce((s, x) => s + x, 0), 0, `${e.id} : charges partielles de somme nulle`);

// molécule fictive AX₂ : le moment diminue quand l'angle augmente et s'annule à 180° ; liaisons C–H non polarisées : toujours apolaire
for (const p of M.PAIRES_AX2) {
  let prec = Infinity;
  for (let a = 60; a <= 180; a += 10) {
    const P = M.polarite(M.moleculeAX2(p, a));
    if (p.id === 'CH') assert.equal(P.polaire, false, 'C–H : apolaire à tout angle');
    else { assert.ok(P.norme <= prec + 1e-9, `${p.id} : norme décroissante`); prec = P.norme;
      assert.ok(proche(P.norme, p.d * Math.cos(a / 2 * Math.PI / 180), 1e-9), `${p.id} ${a}° : norme = d cos(θ/2)`);
      assert.equal(P.polaire, a < 180, `${p.id} ${a}° : polaire seulement si l'angle n'est pas 180°`); }
  }
}

// répulsion de doublets : 2 → 180°, 3 → 120°, 4 → 109,47°
for (const [n, ang] of [[2, 180], [3, 120], [4, 109.47]]) {
  const f = M.relaxer(M.departDesordre(n), 3000);
  M.anglesDeux(f).forEach(a => assert.ok(proche(a, ang, 0.3), `${n} doublets : angle ${a} ≠ ${ang}`));
}
// directions() : les angles entre doublets liants et non liants sont ceux de l'arrangement
for (const [n, m] of [[2, 0], [3, 0], [4, 0], [2, 2], [3, 1]]) {
  const d = M.directions(n, m, n === 2 && m === 2 ? 109.5 : n === 3 && m === 1 ? 109.5 : undefined), tous = [...d.liants, ...d.nonLiants];
  assert.equal(tous.length, n + m);
  const attendu = n + m === 2 ? 180 : n + m === 3 ? 120 : 109.47;
  M.anglesDeux(tous).forEach(a => assert.ok(proche(a, attendu, 0.5), `AX${n}E${m} : angle idéal ${a}`));
}
console.log('geometrieModele : OK');
