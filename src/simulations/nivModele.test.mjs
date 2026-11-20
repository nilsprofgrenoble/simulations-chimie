// Tests du modèle de la simulation 165 : node src/simulations/nivModele.test.mjs
import assert from 'node:assert/strict';
import * as N from './nivModele.js';
const proche = (a, b, t = 1e-3) => Math.abs(a - b) <= Math.abs(b) * t;
// relations
assert.ok(proche(N.lamNmDeEv(1.90), 654.3, 1e-3)); assert.ok(proche(N.evDeLamNm(500), 2.486, 1e-3));
assert.ok(proche(N.evDeLamNm(N.lamNmDeEv(3.1)), 3.1, 1e-12));
// atome X : 6 transitions
const tx = N.transitions(N.ATOMES.X); assert.equal(tx.length, 6);
assert.deepEqual(tx.map(t => Math.round(t.lam)), [350, 436, 654, 753, 1309, 1776]);
assert.deepEqual(tx.map(t => t.dom.id), ['uv', 'vis', 'vis', 'vis', 'ir', 'ir']);
assert.equal(N.transitionsAbsorption(N.ATOMES.X).length, 3);
assert.deepEqual(N.lignesVisibles(N.ATOMES.X), [436, 654, 753]);
assert.deepEqual(N.lignesVisibles(N.ATOMES.Y), [478, 654]);
assert.deepEqual(N.lignesVisibles(N.ATOMES.Z), [414, 540]);
// aucune raie confondue dans un atome (écart > 1 %), pour les atomes fictifs
for (const k of ['X', 'Y', 'Z', 'H']) { const l = N.transitions(N.ATOMES[k]).map(t => t.lam); for (let i = 1; i < l.length; i++) assert.ok(l[i] / l[i - 1] > 1.01, `${k} raies confondues`); }
// sodium : une raie jaune-orangé ≈ 592 nm avec les constantes arrondies (589 nm mesuré)
const na = N.transitions(N.ATOMES.Na); assert.equal(na.length, 1); assert.ok(Math.abs(na[0].lam - 592) < 1); assert.equal(na[0].couleur, 'orange');
// hydrogène : raies connues à 1,5 % près des valeurs mesurées (121,6 ; 656,3 ; 486,1 ; 1875)
const th = N.transitions(N.ATOMES.H); const get = (b, h) => th.find(t => t.bas === b && t.haut === h).lam;
assert.ok(proche(get(0, 1), 121.6, 0.015)); assert.ok(proche(get(1, 2), 656.3, 0.015)); assert.ok(proche(get(1, 3), 486.1, 0.015)); assert.ok(proche(get(2, 3), 1875, 0.015));
// cascades
assert.equal(N.nbRaiesCascade(4), 6); assert.equal(N.nbRaiesCascade(3), 3); assert.equal(N.nbRaiesCascade(2), 1); assert.equal(N.nbRaiesDepuis(N.ATOMES.X, 3), 6);
// absorption : un photon plus grand que ΔE n'est PAS absorbé
const X = N.ATOMES.X; assert.ok(N.absorbe(X, 0, 1.90)); assert.ok(!N.absorbe(X, 0, 2.50)); assert.ok(!N.absorbe(X, 0, 2.00)); assert.ok(N.absorbe(X, 1, 0.95)); assert.ok(!N.absorbe(X, 3, 0.7));
// couleurs : jamais d'erreur sur toute la plage
for (let l = 50; l < 3000; l += 7) { const c = N.couleurRaie(l); assert.ok(typeof c === 'string' && !c.includes('NaN'), l); }
// tirages sur des milliers de graines
let s = 12345; const rng = () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
for (let k = 0; k < 4000; k++) {
  const neg = k % 2 === 0, L = N.tirerNiveaux(rng, 3 + (k % 2), neg);
  for (let i = 1; i < L.length; i++) assert.ok(L[i] > L[i - 1]);
  const at = { niveaux: L }; for (const t of N.transitions(at)) assert.ok(t.lam >= 100 && t.lam <= 2500, `λ=${t.lam} ${L}`);
  const e = N.tirerExciter(rng, null);
  assert.equal(new Set([e.bonne, ...e.faux]).size, 4); for (const f of e.faux) assert.ok(Math.abs(f - e.bonne) > 0.06 * e.bonne);
  assert.ok(Number.isFinite(e.bonne) && e.bonne > 100 && e.bonne < 2000, `bonne ${e.bonne}`);
  const id = N.tirerIdentifier(rng, null); assert.equal(id.raies.length, 3); assert.ok(['A', 'B', 'C'].includes(id.bonne));
  for (const r of id.raies) assert.ok(r >= 100 && r <= 2300);
  const b = N.tirerBalmer(rng, null); assert.ok(b.vrai > 90 && b.vrai < 2000 && Number.isFinite(b.vrai));
}
console.log('nivModele : OK');
