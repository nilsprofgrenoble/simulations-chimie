// Test du modèle de la simulation 176 : node src/simulations/cplModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './cplModele.js';
const pr = (a, b, t = 0.01) => Math.abs(a - b) <= t * Math.abs(b);
// valeurs du parcours : électron, U = 400 V, d = 2,0 cm, v0 = 3,0e7 m/s, L = 6,0 cm
assert.ok(pr(M.normeE(400, 0.02), 2.0e4, 1e-9), 'E = U/d');
assert.ok(pr(M.normeF('electron', 400, 0.02), 3.2e-15, 0.001), 'F = eE');
assert.ok(pr(M.poids('electron'), 8.93e-30, 0.002), 'poids électron');
assert.ok(pr(M.rapportFP('electron', 400, 0.02), 3.58e14, 0.005), 'F/P électron');
assert.ok(pr(M.accY('electron', 400, 0.02), 3.513e15, 0.002), 'a_y électron');
assert.ok(M.accY('electron', 400, 0.02) > 0 && M.accY('proton', 400, 0.02) < 0, 'signes de a_y (plaque du haut +)');
assert.ok(pr(M.deviation('electron', 400, 0.02, 3.0e7), 7.03e-3, 0.005), 'déviation');
const t = M.trajet('electron', 400, 0.02, 3.0e7); assert.ok(t.sort && pr(t.tFin, 2.0e-9, 1e-9));
assert.ok(pr(M.Umax('electron', 0.02, 3.0e7), 569, 0.005), 'U_max');
// à U_max, |y_S| = d/2 exactement
assert.ok(pr(Math.abs(M.deviation('electron', M.Umax('electron', 0.02, 3.0e7), 0.02, 3.0e7)), 0.01, 1e-9));
assert.ok(!M.trajet('electron', 800, 0.02, 3.0e7).sort, 'choc à 800 V');
// à la collision : y = d/2 en x_c
const c = M.trajet('electron', 800, 0.02, 3.0e7); assert.ok(pr(M.k2('electron', 800, 0.02, 3.0e7) * c.xc * c.xc, 0.01, 1e-9));
assert.ok(pr(M.vApresAcc('electron', 250), 9.37e6, 0.005), 'v après 250 V');
assert.ok(pr(M.vApresAcc('proton', 1000), 4.38e5, 0.005), 'proton 1000 V');
// poids négligeable pour toutes les particules dans les plages du site
for (const p of Object.keys(M.PARTICULES)) for (const U of M.TENSIONS) for (const d of M.DISTANCES) assert.ok(M.rapportFP(p, U, d / 100) > 1e8, `${p} ${U} ${d}`);
// vitesses d'entrée non relativistes
for (const p of Object.keys(M.PARTICULES)) for (const v of M.PARTICULES[p].v0) assert.ok(M.nonRelativiste(v), `${p} ${v}`);
// aller-retour Upour / deviation et v0depuis / deviation
assert.ok(pr(M.deviation('proton', M.Upour('proton', 0.03, 5e5, 0.004), 0.03, 5e5), -0.004, 1e-9) || pr(Math.abs(M.deviation('proton', M.Upour('proton', 0.03, 5e5, 0.004), 0.03, 5e5)), 0.004, 1e-9));
assert.ok(pr(M.v0depuis('electron', 400, 0.02, 7.03e-3), 3.0e7, 0.003));
// énergie à la sortie : ΔEc = ½ m (v² − v0²) = |q| E y_S ; avertissement relativiste sur la vitesse d'entrée seulement
{ const t = M.trajet('electron', 400, 0.02, 3.0e7), dec = 0.5 * 9.11e-31 * (t.v * t.v - 9e14); assert.ok(pr(M.gainEc('electron', 400, 0.02, 3.0e7), dec, 1e-9), 'ΔEc = W(F)'); assert.ok(M.limiteRelativiste(3.0e7) && !M.limiteRelativiste(2.0e7) && M.nonRelativiste(3.0e7)); }
for (const k of Object.keys(M.PARTICULES)) for (const v of M.PARTICULES[k].v0) assert.ok(M.nonRelativiste(v));
assert.ok(M.DISTANCES.every(d => d <= 2.0), 'd petit devant L');
// tirages : défi 1 faisable (la tension cachée donne la cible à 10 % près, la grille de 5 V permet au moins deux valeurs gagnantes), défi 2 : tolérance 6 % ≥ pire arrondi
let minLarg = Infinity, pire = 0;
for (let i = 0; i < 20000; i++) {
  const s = M.tirageCible(); const y = U => Math.abs(M.deviation(s.p, U, s.d / 100, s.v0)) * 1000;
  assert.ok(Math.abs(y(s.Us) - s.yc) <= 0.1 * s.yc, 'cible atteignable'); assert.ok(s.Us >= 100 && s.Us <= 600);
  let n = 0; for (let U = 5; U <= 2000; U += 5) if (Math.abs(y(U) - s.yc) <= 0.1 * s.yc) n++; minLarg = Math.min(minLarg, n);
  assert.ok(M.trajet(s.p, s.Us, s.d / 100, s.v0).sort, 'la tension cachée fait sortir la particule');
  const v = M.tirageVitesse(); pire = Math.max(pire, M.pireEcartVitesse(v)); assert.ok(M.nonRelativiste(v.v0));
  assert.ok(Math.abs(v.vrai - v.v0) / v.v0 < 0.06, 'v0 retrouvée à 6 %'); assert.ok(M.pireEcartVitesse(v) <= 0.06, `pire écart ${M.pireEcartVitesse(v)}`);
}
console.log(`OK : modèle 176 ; valeurs gagnantes au moins ${minLarg} pas de 5 V ; pire écart défi vitesse ${(100 * pire).toFixed(1)} %`);
