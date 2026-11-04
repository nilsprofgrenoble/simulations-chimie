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

// ───────── Interférences et réseaux (sim 84) ─────────
// 8. Cuve : retard, nature de l’interférence, hyperboles
const [r1a, r2a] = M.distancesSources(4, 15, 0);
proche(r1a, r2a, 1e-12, 'sur l’axe de symétrie r1 = r2');
assert.strictEqual(M.natureInterference(0), 'constructive');
assert.strictEqual(M.natureInterference(2.02), 'constructive');
assert.strictEqual(M.natureInterference(1.5), 'destructive');
assert.strictEqual(M.natureInterference(0.25), 'intermédiaire');
proche(M.retardCuve(2, 10, 12), M.T_CUVE, 1e-9, 'δ = λ → τ = T');
proche(M.celeriteCuve(2), 0.4, 1e-9, 'v = λ f = 2 cm × 20 Hz');
for (const d of [0.5, 1, 2, 3]) { const x = 12, y = M.yPourDelta(4, d, x), [r1, r2] = M.distancesSources(4, x, y); proche(Math.abs(r2 - r1), d, 1e-9, `hyperbole δ = ${d}`); }
assert.strictEqual(M.yPourDelta(4, 5, 10), null, 'pas de point avec δ > s');
// champ : maxima sur l’axe (amplitude double), annulation sur une hyperbole destructive
{ const lam2 = 2, s2 = 6, xs = [14], ysM = [M.yPourDelta(s2, lam2 * 1.5, 14)], ys0 = [0];
  const c = M.champCuveDeux({ s: s2, lambda: lam2, xs, ys: ys0 }), d = M.champCuveDeux({ s: s2, lambda: lam2, xs, ys: ysM });
  const A0 = Math.hypot(c.re[0], c.im[0]), Ad = Math.hypot(d.re[0], d.im[0]);
  assert(A0 > 0.9 && Ad < 0.1 * A0, `cuve : constructif (${A0.toFixed(2)}) vs destructif (${Ad.toFixed(3)})`); }
// 9. Young : interfrange i = λD/l (distance entre deux maxima voisins de l’enveloppe lissée)
{ const a2 = 80e-6, l2 = 300e-6, la = 532e-9, D2 = 2.5, i = M.interfrange(l2, la, D2);
  proche(i, 4.433e-3, 1e-3, 'i = λD/l');
  const I = x => M.intensiteEcranYoung(a2, l2, la, D2, x);
  assert(I(0) > 0.99 && I(i / 2) < 0.01 * I(0) + 1e-3 && I(i) > 0.9 * M.intYoung(a2, l2, la, i / D2) , 'franges : max en 0 et i, min en i/2');
  proche(I(i), M.intFente(a2, la, i / D2), 0.02, 'maximum d’ordre 1 sous l’enveloppe de diffraction');
  proche(M.frangesDansTache(a2, l2), 7.5, 1e-9, '2l/a franges dans la tache centrale');
  proche(M.distanceFentes(i, la, D2), l2, 1e-9, 'inversion de l');
  proche(M.lambdaDepuisInterfrange(i, l2, D2), la, 1e-9, 'inversion de λ'); }
// 10. Réseau : positions des ordres, ordre maximal, pic principal d’intensité
{ const pas = 3.333e-6, la = 532e-9, N = 30, w = 0.3 * pas;
  proche(M.sinOrdre(1, la, pas), 0.1596, 2e-3, 'sinθ1');
  proche(M.thetaOrdre(1, la, pas) / M.RAD, 9.19, 2e-3, 'θ1 en degrés');
  assert.strictEqual(M.ordreMax(la, pas), 6, 'ordre maximal visible');
  assert.strictEqual(M.ordreMax(650e-9, 1.0e-6), 1, 'pas 1 µm, 650 nm : seulement l’ordre 1');
  assert.strictEqual(M.ordreMax(500e-9, 1.0e-6), 1, 'kλ/a = 1 exactement : l’ordre 2 est tangent, non observable');
  for (const k of [0, 1, 2, 3]) {
    const s = M.sinOrdre(k, la, pas), I = M.intReseau(pas, N, w, la, s), Iv = M.intReseau(pas, N, w, la, s + 1.5 * la / (N * pas));
    assert(I > 5 * Iv, `ordre ${k} : pic net`); }
  const I1 = M.intReseau(pas, N, w, la, M.sinOrdre(1, la, pas)), I0 = M.intReseau(pas, N, w, la, 0);
  proche(I1 / I0, M.sinc(Math.PI * w * M.sinOrdre(1, la, pas) / la) ** 2, 1e-6, 'intensité de l’ordre 1 = enveloppe de diffraction');
  assert(M.intReseau(pas, N, pas, la, M.sinOrdre(3, la, pas)) < 1e-12, 'ordre manquant quand w = a : enveloppe nulle en k = 3 si w = pas (sinc)'); 
  const D3 = 1, x1 = M.positionOrdre(1, la, pas, D3);
  proche(M.pasDepuisOrdre(1, la, M.thetaDepuisPosition(x1, D3)), pas, 1e-9, 'inversion du pas');
  proche(M.lambdaDepuisOrdre(2, pas, M.thetaOrdre(2, la, pas)), la, 1e-9, 'inversion de λ'); }
// largeur du pic principal ≈ λ D / (N a) : zéros voisins en sinθ = k λ/a ± λ/(N a)
{ const pas = 3.333e-6, la = 532e-9, N = 30, s0 = M.sinOrdre(1, la, pas);
  assert(M.intReseau(pas, N, pas / 3, la, s0 + la / (N * pas)) < 1e-12, 'premier zéro voisin du pic'); }
// 11. Incertitude sur le pas : dérivées vérifiées par différences finies
{ const k = 1, la = 532e-9, D4 = 1, pas = 3.333e-6, x = M.positionOrdre(1, la, pas, D4);
  const base = { k, lambda: la, x, D: D4, dx: 0.0015, dD: 2e-3, dLambda: 0.01 * la };
  const r = M.incertitudePas(base); proche(r.a, pas, 1e-9, 'a = kλ/sinθ');
  const f = (xx, DD, ll) => k * ll / (xx / Math.hypot(xx, DD));
  const h = 1e-7, dax = (f(x + h, D4, la) - f(x - h, D4, la)) / (2 * h), daD = (f(x, D4 + h, la) - f(x, D4 - h, la)) / (2 * h), dal = k / (x / Math.hypot(x, D4));
  const uref = Math.sqrt((dax * M.uB(base.dx)) ** 2 + (daD * M.uB(base.dD)) ** 2 + (dal * M.uB(base.dLambda)) ** 2);
  proche(r.u, uref, 1e-4, 'u(a) = propagation des incertitudes (dérivées partielles)');
  proche(r.part.reduce((p, q) => p + q, 0), 1, 1e-9, 'poids de somme 1'); }

console.log('ondesModele : tous les tests passent (extinction cuve à', tmin, '° ; attendu', (Math.asin(0.25) / M.RAD).toFixed(1), '°)');
