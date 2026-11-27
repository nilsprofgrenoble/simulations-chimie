// Test du modèle de cristallisation : node src/simulations/cristallisationModele.test.mjs
import assert from 'node:assert';
import * as M from './cristallisationModele.js';

const proche = (a, b, tol, msg) => assert(Math.abs(a - b) <= tol * Math.abs(b), `${msg} : ${a} ≠ ${b}`);

// Valeurs tabulées exactes et interpolation linéaire
assert.strictEqual(M.solubilite(80), 169);
assert.strictEqual(M.solubilite(0), 13.3);
proche(M.solubilite(55), (85.5 + 110) / 2, 1e-12, 'milieu 50-60 °C');
assert.strictEqual(M.solubilite(-5), 13.3);       // bornée à 0 °C
assert.strictEqual(M.solubilite(120), 246);       // bornée à 100 °C
// La solubilité de KNO₃ croît strictement avec la température
for (let i = 1; i < M.SOLUB.length; i++) assert(M.SOLUB[i][1] > M.SOLUB[i - 1][1], 'courbe croissante');

// Fonction inverse : 100 g pour 100 g d'eau → ≈ 55,9 °C (valeur du parcours guidé)
proche(M.tempDeSolub(100), 55.9, 1e-3, 'température d’apparition des cristaux');
for (const T of [3, 17, 42.5, 66, 99]) proche(M.tempDeSolub(M.solubilite(T)), T, 1e-9, 'inverse');

// Refroidissement : 100 g dans 100 g d'eau
let e = M.etat(100, 100, 80);
assert(!e.sature && e.cristaux === 0 && e.rendement === 0, 'à 80 °C tout est dissous');
e = M.etat(100, 100, 40);
proche(e.cristaux, 36.1, 1e-9, 'cristaux à 40 °C'); proche(e.dissous, 63.9, 1e-9, 'dissous à 40 °C');
e = M.etat(100, 100, 20);
proche(e.rendement, 68.4, 1e-9, 'rendement à 20 °C');
// Conservation de la matière
for (const [m, w, T] of [[100, 100, 20], [50, 20, 60], [80, 250, 10]]) {
  const r = M.etat(m, w, T); proche(r.dissous + r.cristaux, m, 1e-12, 'conservation');
}
// Jamais tout récupéré, même à 0 °C
assert(M.etat(100, 100, 0).rendement < 100);

// Évaporation à 60 °C : 50 g de sel
proche(M.eauSaturation(50, 60), 45.4545, 1e-4, 'eau à la saturation');
e = M.etat(50, 20, 60);
proche(e.cristaux, 50 - 22, 1e-9, 'cristaux avec 20 g d’eau'); proche(e.concentration, 110, 1e-9, 'solution saturée : concentration = solubilité');
// Juste avant la saturation, aucun cristal ; juste après, des cristaux
assert(!M.etat(50, 45.5, 60).sature && M.etat(50, 45.4, 60).sature);
// La concentration augmente quand on évapore (avant saturation)
assert(M.etat(50, 80, 60).concentration > M.etat(50, 100, 60).concentration);

// NaCl : courbe presque horizontale
const dNaCl = M.SOLUB_NACL[M.SOLUB_NACL.length - 1][1] - M.SOLUB_NACL[0][1];
assert(dNaCl < 5, 'NaCl varie très peu');
console.log('cristallisationModele : OK');

// pression de vapeur saturante de l'eau : 19,94 kPa à 60 °C, 101,3 kPa à 100 °C, croissante
import { pSatEau as _p } from "./cristallisationModele.js";
if (Math.abs(_p(60) - 19.94) > 1e-9 || Math.abs(_p(100) - 101.3) > 1e-9 || !(_p(65) > _p(60) && _p(65) < _p(70))) { console.error("pSatEau : valeurs incorrectes"); process.exit(1); }
console.log("OK : pression de vapeur saturante de l'eau");
