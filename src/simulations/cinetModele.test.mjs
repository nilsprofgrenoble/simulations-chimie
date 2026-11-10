import assert from 'node:assert/strict';
import { evolution, composition, rapportCinetique, rapportThermo, regime, E, tempsDepuisCurseur, curseurDepuisTemps } from './cinetModele.js';
const T0 = 273.15, T40 = 313.15;
const c0 = composition(evolution(T0), 5), c40 = composition(evolution(T40), 3 * 3600);
assert.ok(c0.R < 1 && c0.P12 > 70 && c0.P12 < 85, `0 °C, 5 s : ${JSON.stringify(c0)}`);
assert.ok(c40.R < 0.1 && c40.P14 > 90, `40 °C, 3 h : ${JSON.stringify(c40)}`);
assert.equal(regime(c0, T0), 'cinetique'); assert.equal(regime(c40, T40), 'thermo');
assert.equal(regime(composition(evolution(T40), 60), T40), 'transition');
assert.equal(regime(composition(evolution(T0), 0.001), T0), 'cours');
// conservation de la matière et positivité sur toute la plage
for (const C of [-80, -40, 0, 25, 80]) for (const p of evolution(C + 273.15)) { assert.ok(Math.abs(p.R + p.P12 + p.P14 - 1) < 0.02, `bilan ${C} ${p.t} ${p.R + p.P12 + p.P14}`); assert.ok(p.R >= 0 && p.P12 >= 0 && p.P14 >= 0); }
// limites : équilibre = loi de Boltzmann sur ΔE ; vérifié à 40 °C, 10⁶ s
const f = composition(evolution(T40), 1e6); assert.ok(Math.abs(f.P14 / f.P12 - rapportThermo(T40)) / rapportThermo(T40) < 0.05, 'équilibre');
assert.ok(Math.abs(rapportThermo(T40) - Math.exp(7000 / (8.314 * T40))) < 1e-6);
assert.equal(E.P12 - E.P14, 7); assert.equal(E.ET2a - E.P12, 90); assert.equal(E.ET2b - E.P14, 100);
assert.ok(Math.abs(curseurDepuisTemps(tempsDepuisCurseur(500)) - 500) <= 1);
console.log('cinétique/thermo : OK');
