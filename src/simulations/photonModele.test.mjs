// Tests du modèle de la simulation 164 : node src/simulations/photonModele.test.mjs
import assert from 'node:assert/strict';
import * as P from './photonModele.js';
const proche = (a, b, t = 1e-3) => Math.abs(a - b) <= Math.abs(b) * t;

// relations de base
assert.ok(proche(P.nuDeLambda(532e-9), 5.639e14, 1e-3));
assert.ok(proche(P.lambdaDeNu(6.0e9), 0.05));
assert.ok(proche(P.energieDeLambda(532e-9), 3.739e-19, 1e-3));
assert.ok(proche(P.jVersEv(P.energieDeLambda(532e-9)), 2.337, 1e-3));
assert.ok(proche(P.lambdaDeEv(3.00), 414.4e-9, 1e-3));
assert.ok(proche(P.energieDeNu(P.nuDeLambda(500e-9)), P.energieDeLambda(500e-9), 1e-12));
assert.ok(proche(P.photonsParSeconde(1.0e-3, 532e-9), 2.674e15, 1e-3));
// aller-retour
for (const l of [1e3, 0.3, 1e-3, 780e-9, 400e-9, 1e-12, 1e-13]) { assert.ok(proche(P.lambdaDeNu(P.nuDeLambda(l)), l, 1e-12)); assert.ok(proche(P.lambdaDeEv(P.jVersEv(P.energieDeLambda(l))), l, 1e-12)); }
// domaines : bornes et partition (chaque longueur d'onde dans UN seul domaine)
const cas = [[1e3, 'radio'], [3, 'radio'], [0.125, 'micro'], [1e-3, 'micro'], [0.999e-3, 'ir'], [10e-6, 'ir'], [780e-9, 'ir'], [779e-9, 'vis'], [400e-9, 'vis'], [399e-9, 'uv'], [10e-9, 'uv'], [9.9e-9, 'x'], [9e-9, 'x'], [1e-10, 'x'], [10e-12, 'x'], [9.9e-12, 'gamma'], [1e-12, 'gamma'], [1e-13, 'gamma']];
for (const [l, d] of cas) assert.equal(P.domaineDeLambda(l).id, d, `λ = ${l}`);
for (let x = P.LOG_MIN; x <= P.LOG_MAX; x += 0.01) { const l = 10 ** x; assert.equal(P.DOMAINES.filter(d => l >= d.lmin && l < d.lmax).length, 1, `partition à 10^${x}`); }
// applications : domaine attendu
const att = { fm: 'radio', wifi: 'micro', four: 'micro', tele: 'ir', laser: 'vis', bronz: 'uv', xray: 'x', gamma: 'gamma' };
for (const a of P.APPLICATIONS) assert.equal(P.domaineDeLambda(a.lam).id, att[a.id], a.id);
// aucune valeur non finie sur tout le curseur
for (let x = P.LOG_MIN; x <= P.LOG_MAX + 1e-9; x += 0.01) { const l = 10 ** x; for (const v of [P.nuDeLambda(l), P.energieDeLambda(l), P.jVersEv(P.energieDeLambda(l))]) assert.ok(Number.isFinite(v) && v > 0); for (const t of [P.lambdaTexte(l), P.nuTexte(P.nuDeLambda(l)), P.evTexte(P.jVersEv(P.energieDeLambda(l))), P.sci(l), P.sci(P.energieDeLambda(l))]) assert.ok(!t.includes('NaN') && !t.includes('undefined') && !t.includes('Infinity'), t); }
// mise en forme
assert.equal(P.dec(5.32), '5,32'); assert.equal(P.dec(0.0501), '0,0501'); assert.equal(P.dec(125), '125'); assert.equal(P.dec(12.5), '12,5');
assert.equal(P.sci(5.32e-7), '5,32 × 10⁻⁷'); assert.equal(P.sci(3.739e-19), '3,74 × 10⁻¹⁹'); assert.equal(P.sci(9.999e5), '1,00 × 10⁶');
assert.equal(P.lambdaTexte(532e-9), '532 nm'); assert.equal(P.lambdaTexte(1e-6), '1,00 µm'); assert.equal(P.lambdaTexte(0.125), '125 mm'); assert.equal(P.lambdaTexte(3), '3,00 m'); assert.equal(P.lambdaTexte(1e3), '1,00 km');
assert.equal(P.nuTexte(2.4e9), '2,40 GHz'); assert.equal(P.nuTexte(5.64e14), '564 THz'); assert.equal(P.nuTexte(1e8), '100 MHz');
assert.equal(P.evTexte(2.337), '2,34 eV'); assert.equal(P.evTexte(1.24e4), '12,4 keV'); assert.equal(P.evTexte(1.24e-9), '1,24 neV');
assert.equal(P.couleurVisible(532), 'vert'); assert.equal(P.couleurVisible(300), null); assert.equal(P.couleurVisible(650), 'rouge');
console.log('photonModele : OK');

// ───── Tirages des défis : des milliers de graines ─────
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const bornes = [0.30, 1e-3, 780e-9, 400e-9, 10e-9, 10e-12];
for (const it of P.ITEMS_DOMAINE) {
  assert.equal(P.domaineDeLambda(it.lam).id, it.dom, it.txt);
  for (const b of bornes) assert.ok(Math.abs(it.lam / b - 1) > 0.10, `${it.txt} trop près de la borne ${b}`);
}
let vus = new Set(), prev = null;
for (let s = 1; s <= 5000; s++) {
  const r = mulberry(s);
  const d = P.tirerDomaine(r, prev); assert.ok(d && P.domaineDeLambda(d.lam).id === d.dom); prev = d.txt; vus.add(d.dom);
  const e = P.tirerEnergie(r); assert.ok(Number.isFinite(e.vrai) && e.vrai > 0.5 && e.vrai < 6, `énergie ${e.nm}`);
  assert.ok(proche(e.vrai, 6.63e-34 * 3.00e8 / (e.nm * 1e-9) / 1.60e-19, 1e-12));
  const h = P.tirerPhotons(r, { nm: 532, mw: 1.0 }); assert.ok(Number.isFinite(h.vrai) && h.vrai > 1e15 && h.vrai < 2e16, `photons ${h.nm} ${h.mw}`);
}
assert.equal(vus.size, 7, 'tous les domaines sont tirés');
// la réponse arrondie à 3 chiffres significatifs reste dans la tolérance de 2 % (énergie et photons par seconde)
for (const nm of P.LAMBDA_ENERGIE_NM) { const v = P.tirerEnergie(() => P.LAMBDA_ENERGIE_NM.indexOf(nm) / P.LAMBDA_ENERGIE_NM.length + 1e-9).vrai; assert.ok(proche(Number(v.toPrecision(3)), v, 0.006)); }
console.log('tirages : OK');
