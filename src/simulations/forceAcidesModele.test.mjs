// Test du modèle « force des acides » (sim 129) : node src/simulations/forceAcidesModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './forceAcidesModele.js';

const proche = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= Math.abs(b) * tol, `${msg} : ${a} ≠ ${b} (tol ${tol})`);

// acide fort : pH = −log C, transformation totale, plus d'acide
for (const C of [0.1, 0.05, 0.02, 0.01, 0.001]) {
  const e = M.etat(M.ACIDES.hcl, C);
  proche(e.pH, M.pHFort(C), 1e-4, `pH HCl ${C}`); assert.equal(e.tau, 1); assert.equal(e.AH, 0); proche(e.h, C, 1e-3, 'h = C');
}
assert.equal(M.arrondiPH(M.pHFort(0.02)), 1.7);
// acide éthanoïque 0,010 mol/L : pH 3,39 ; τ ≈ 0,041 ; Ka retrouvé depuis le pH
const eth = M.etat(M.ACIDES.ch3, 0.010);
assert.equal(M.arrondiPH(eth.pH), 3.39); proche(eth.tau, 0.0408, 0.01, 'τ éthanoïque'); proche(M.tauDepuisPH(0.010, 3.39), 0.0407, 0.01, 'τ depuis pH');
proche(M.kaDepuisPH(0.010, 3.39), 1.73e-5, 0.01, 'Ka depuis pH 3,39'); proche(M.kaDe(4.76), 1.74e-5, 0.01, 'Ka(4,76)');
proche(M.pKaDe(1.7e-5), 4.77, 0.001, 'pKa(1,7e-5)');
// dilution : τ augmente, pH augmente de moins de 1, Ka inchangé
const dil = M.etat(M.ACIDES.ch3, 0.0010);
assert.ok(dil.tau > eth.tau * 2); assert.ok(dil.pH - eth.pH < 1 && dil.pH > eth.pH); proche(dil.tau, 0.123, 0.01, 'τ dilué');
// Ke
proche(M.hoDepuisPH(3.39), 2.45e-11, 0.01, '[HO⁻] pH 3,39'); proche(M.KE, 1e-14, 1e-12, 'Ke');
for (const id of M.ORDRE) for (const C of [0.1, 0.01, 0.001]) { const e = M.etat(M.ACIDES[id], C); proche(e.h * e.HO, 1e-14, 1e-9, 'Ke = [H₃O⁺][HO⁻]'); }
// équation du second degré : x = 5,75e-4 pour C = 0,020 et Ka = 1,7e-5 ; vérifie l'équation
const x = M.hQuadratique(0.020, 1.7e-5);
proche(x, 5.75e-4, 0.002, 'racine'); assert.ok(Math.abs(x * x + 1.7e-5 * x - 1.7e-5 * 0.020) < 1e-15);
proche(M.hApprox(0.020, 1.7e-5), 5.83e-4, 0.005, 'approx'); assert.ok(Math.abs(M.hApprox(0.020, 1.7e-5) - x) / x > 0.01);
// classement : à même C, plus le pKa est petit, plus τ est grand et plus le pH est petit
const ordre = ['hcooh', 'c6h5', 'ch3', 'nh4'].map(id => M.etat(M.ACIDES[id], 0.010));
for (let i = 1; i < ordre.length; i++) { assert.ok(ordre[i].tau < ordre[i - 1].tau); assert.ok(ordre[i].pH > ordre[i - 1].pH); }
// cohérence : la formule de Ka avec les concentrations d'équilibre retrouve Ka
for (const id of ['hcooh', 'c6h5', 'ch3', 'nh4']) { const e = M.etat(M.ACIDES[id], 0.02); proche(e.A * e.h / e.AH, e.Ka, 1e-6, `Ka ${id}`); proche(e.A, e.h, 1e-3, `[A⁻] = [H₃O⁺] ${id}`); }
assert.equal(M.nbTransformees(M.etat(M.ACIDES.hcl, 0.01).tau), 100); assert.equal(M.nbTransformees(eth.tau), 4);
// défi : le Ka attendu part du pH affiché (2 décimales)
for (const C of M.CONC_DEFI) for (const pKa of M.PKA_DEFI) { const d = M.mesureDefi(false, C, pKa); proche(d.ka, M.kaDepuisPH(C, d.pH), 1e-12, 'défi'); assert.ok(M.hDepuisPH(d.pH) / C < 0.07); }
console.log('forceAcidesModele : tous les tests passent');
