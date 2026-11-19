// Test du modèle de la sim 151 : node src/simulations/ondesPeriodeModele.test.mjs
import assert from 'node:assert';
import * as M from './ondesPeriodeModele.js';
const pr = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1), `${msg} : ${a} ≠ ${b}`);
const P0 = { A: 2, T: 0.4, c: 50 };
pr(M.lambda(50, 0.4), 20, 1e-12, 'λ = c·T'); pr(M.frequence(0.4), 2.5, 1e-12, 'f = 1/T');
// double périodicité : y(x, t + T) = y(x, t) et y(x + λ, t) = y(x, t)
for (const [x, t] of [[0, 0], [10, 0.13], [37.5, 0.9], [80, 1.5]]) {
  pr(M.y(x, t + 0.4, P0), M.y(x, t, P0), 1e-9, 'périodicité en t'); pr(M.y(x + 20, t, P0), M.y(x, t, P0), 1e-9, 'périodicité en x');
  pr(M.y(x + 10, t, P0), -M.y(x, t, P0), 1e-9, 'opposition de phase à λ/2');
}
assert(Math.abs(M.y(10, 0.3, P0)) <= 2 + 1e-12, 'amplitude');
// la perturbation avance à c : la crête se décale de c·Δt
const c0 = M.cretes(0.2, P0), c1 = M.cretes(0.3, P0);
pr(c0[0], 20 * (0.5 - 0.25), 1e-9, 'première crête à t = 0,2 s (x = 5 cm)'); pr(c1[0] - c0[0], 50 * 0.1, 1e-9, 'décalage = c·Δt');
for (const x of M.cretes(0.37, P0)) pr(M.y(x, 0.37, P0), 2, 1e-9, 'y = A à la crête');
for (const t of M.maxima(10, P0)) pr(M.y(10, t, P0), 2, 1e-9, 'y = A au maximum');
assert.equal(M.maxima(10, P0).length, 4, 'quatre maxima en 1,6 s pour T = 0,4 s');
// phase
assert.equal(M.etatPhase(40, 20), 'phase'); assert.equal(M.etatPhase(10, 20), 'opposition'); assert.equal(M.etatPhase(15, 20), 'autre'); assert.equal(M.etatPhase(0, 20), 'confondus');
assert.equal(M.etatPhase(50, 20), 'opposition'); assert(M.ecartMultiple(41, 20) <= 1 && M.ecartMultiple(10, 20) === 10);
assert.equal(M.etatPhase(0.5, 20), 'quasi'); assert.equal(M.etatPhase(1, 20), 'autre'); assert.equal(M.etatPhase(40.5, 20), 'phase');
// tirages de défi : tous visibles et λ ≥ 9 cm
const tir = M.tirages(); assert(tir.length >= 10);
for (const { T, c, L } of tir) { pr(L, c * T, 1e-12, 'λ du tirage'); assert(L >= 9 && L <= 50); assert(M.X_MAX / L >= 2); }
// grille de T du curseur : λ = c·T est un nombre à 2 chiffres significatifs au plus pour tous les milieux
for (let T = M.T_MIN; T <= M.T_MAX + 1e-9; T += M.T_PAS) for (const m of M.MILIEUX) { const L = M.lambda(m.c, T); assert(Math.abs(L * 2 - Math.round(L * 2)) < 1e-6, `λ multiple de 0,5 cm (T=${T}, c=${m.c})`); }
console.log('ondesPeriodeModele : OK');
