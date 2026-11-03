// Test du modèle des ondes : node src/simulations/ondesModele.test.mjs
import assert from 'node:assert';
import * as M from './ondesModele.js';

const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);

// 1. Fente : première extinction en sinθ = λ/a, intensité nulle, tache centrale = 2λD/a
const a = 100e-6, lam = 532e-9, D = 2;
assert(M.intFente(a, lam, lam / a) < 1e-12, 'extinction en sinθ = λ/a');
assert(M.intFente(a, lam, 2 * lam / a) < 1e-12, 'extinction en sinθ = 2λ/a');
proche(M.intFente(a, lam, 1.43 * lam / a), 0.0472, 0.03, 'premier maximum secondaire ≈ 4,7 % du central');
proche(M.largeurFente(a, lam, D), 0.02128, 1e-9, 'L = 2λD/a');
// l’approximation des petits angles est excellente ici
proche(M.largeurFenteExacte(a, lam, D), M.largeurFente(a, lam, D), 1e-3, 'petits angles');
// et mauvaise quand a ≈ λ : on le dit à l’élève
assert(Math.abs(M.largeurFenteExacte(1e-6, lam, D) / M.largeurFente(1e-6, lam, D) - 1) > 0.05, 'petits angles : plus valable pour a = 1 µm');

// 2. Trou circulaire : première extinction en sinθ = 1,22 λ/d
const d = 100e-6, s1 = 1.2197 * lam / d;
assert(M.intTrou(d, lam, s1) < 1e-5, 'extinction du trou en 1,22 λ/d');
proche(M.PREMIER_ZERO_J1, 1.22 * Math.PI, 0.002, 'zéro de J1');
assert(M.intTrou(d, lam, 0) === 1);
proche(M.intTrou(d, lam, 1.635 * lam / d), 0.0175, 0.03, 'premier anneau du disque d’Airy ≈ 1,75 %');
proche(M.largeurTrou(d, lam, D), 2.44 * lam * D / d, 1e-12, 'L = 2,44 λD/d');
// J1 : valeurs connues
proche(M.J1(1), 0.4400505857, 1e-6, 'J1(1)'); proche(M.J1(10), 0.0434727462, 1e-5, 'J1(10)'); proche(M.J1(-2), -0.5767248078, 1e-6, 'J1(−2)');

// 3. Inversions et symétries
proche(M.tailleDepuisL('fente', M.largeurFente(a, lam, D), lam, D), a, 1e-9, 'inversion fente');
proche(M.tailleDepuisL('trou', M.largeurTrou(d, lam, D), lam, D), d, 1e-9, 'inversion trou');
proche(M.lambdaDepuisL('fente', a, M.largeurFente(a, lam, D), D), lam, 1e-9, 'λ à partir de L');
assert(M.intensiteEcran('fil', a, lam, D, 0.003) === M.intensiteEcran('fente', a, lam, D, 0.003), 'Babinet : fil et fente donnent la même figure');
proche(M.intensiteEcran('fente', a, lam, D, 0.003), M.intensiteEcran('fente', a, lam, D, -0.003), 1e-12, 'symétrie');
assert(M.intensiteEcran('fente', a, lam, D, M.largeurFente(a, lam, D) / 2) < 1e-4, 'extinction à ± L/2 sur l’écran');

// 4. Couleurs
const [r, g, b] = M.rgbLambda(650); assert(r > 0.9 && g < 0.1 && b < 0.1, 'rouge');
const [r2, g2, b2] = M.rgbLambda(532); assert(g2 > 0.9 && r2 < 0.5 && b2 < 0.1, 'vert');
assert(M.nomCouleur(405) === 'violet' && M.nomCouleur(532) === 'vert' && M.nomCouleur(650) === 'rouge');

// 5. Incertitudes (type B, loi rectangulaire, sources indépendantes)
const inc = M.incertitudeTaille({ a: 100e-6, L: 21.28e-3, D: 2, lambda: 532e-9, dL: 2e-3, dD: 2e-3, dLambda: 5e-9 });
proche(inc.uL, 2e-3 / Math.sqrt(3), 1e-9, 'u(L)');
proche(inc.part.reduce((x, y) => x + y, 0), 1, 1e-9, 'poids = 1');
assert(inc.part[0] > 0.9, 'L domine quand on mesure une tache de 2 cm au millimètre');
const inc2 = M.incertitudeTaille({ a: 100e-6, L: 21.28e-3 * 4, D: 8, lambda: 532e-9, dL: 2e-3, dD: 2e-3, dLambda: 5e-9 });
assert(inc2.rel < inc.rel / 3, 'quatre fois plus loin : incertitude relative plus de 3 fois plus petite');
assert(M.compatible(100e-6, 105e-6, 3e-6) && !M.compatible(100e-6, 120e-6, 3e-6), 'critère 2u');

// 6. Cuve à ondes : l’énergie lointaine est contenue dans le cône de demi-ouverture asin(λ/a) (à ~10 % près)
const lam2 = 1, a2 = 4;                   // cm : λ/a = 0,25 → θ ≈ 14,5°
const R = 60, thetas = []; for (let t = -60; t <= 60; t += 0.5) thetas.push(t);
const xs = [], ys = [];
const pts = thetas.map(t => [R * Math.cos(t * M.RAD), R * Math.sin(t * M.RAD)]);
const ch = M.champCuve({ a: a2, lambda: lam2, xs: pts.map(p => p[0]), ys: [0], N: 60 });          // une seule ligne : on teste y = 0 uniquement
// Pour tester l’angle on évalue ligne par ligne
function intensiteEn(x, y) { const c = M.champCuve({ a: a2, lambda: lam2, xs: [x], ys: [y], N: 60 }); return c.re[0] ** 2 + c.im[0] ** 2; }
const prof = thetas.map((t, i) => intensiteEn(pts[i][0], pts[i][1]));
// première extinction (minimum local autour de ±14,5°) : cherche le minimum entre 10° et 20°
let tmin = 0, vmin = Infinity; thetas.forEach((t, i) => { if (t > 8 && t < 22 && prof[i] < vmin) { vmin = prof[i]; tmin = t; } });
proche(tmin, Math.asin(0.25) / M.RAD, 0.07, 'cuve : première extinction à asin(λ/a)');
assert(prof[thetas.indexOf(0)] > 5 * vmin, 'cuve : centre plus intense que la première extinction');
console.log('ondesModele : tous les tests passent (extinction cuve à', tmin, '° ; attendu', (Math.asin(0.25) / M.RAD).toFixed(1), '°)');
