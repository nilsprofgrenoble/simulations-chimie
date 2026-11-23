// Verrou du moteur de la simulation 53 (« Solubilité et miscibilité : le bilan des interactions ») et de la page 219 (« le modèle en détail »).
// La page affiche « N couples retrouvés sur M », calculé au rendu : ce test fait échouer toute modification du moteur qui changerait ce score sans qu'on le décide.
// Si la batterie de couples est requalifiée (étiquettes revues avec une source), mettre à jour ATTENDUS_FAUX et PLANCHER ci-dessous, sans re-régler les seuils ni les δ.
import assert from 'node:assert/strict';
import { BATTERIE, bilan, NACL, RT } from './solubiliteModele.js';

assert.equal(BATTERIE.length, 86);

const faux = BATTERIE.filter(([s, e, r]) => bilan(s, e).classe !== r).map(([s, e, r]) => `${s}+${e}:${r}>${bilan(s, e).classe}`);
const ATTENDUS_FAUX = [
  'eau+acetone:ok>lim', 'eau+butanol:lim>ok', 'eau+ether:lim>non', 'ethanol+toluene:ok>lim', 'methanol+hexane:lim>non',
  'methanol+cyclohexane:lim>non', 'propanol+hexane:ok>lim',
  'butanol+hexane:ok>lim', 'ethanol+ccl4:ok>lim',
];
assert.deepEqual(faux, ATTENDUS_FAUX);
const PLANCHER = 77;
assert.ok(BATTERIE.length - faux.length >= PLANCHER, `couples retrouvés : ${BATTERIE.length - faux.length}`);

// NaCl dans l'eau : solde d'énergie de Gibbs ≈ −9,0 kJ/mol, solubilité estimée ≈ 359 g/kg (mesurée : 360)
const sel = bilan('eau', 'nacl');
assert.ok(Math.abs(sel.total + 9.0) < 0.05, `solde NaCl : ${sel.total}`);
assert.ok(Math.abs(sel.sEstime - 359) < 1, `solubilité estimée : ${sel.sEstime}`);
assert.ok(Math.abs(NACL.hydNa + NACL.hydCl - 727.6) < 1e-9);

// Perte critique : facteur 1000 (cm³/mol → L) ; eau + éthanol : perte ≈ 48 kJ/L, perte critique ≈ 166 kJ/L, r ≈ 0,29
const ee = bilan('eau', 'ethanol');
assert.ok(Math.abs(ee.total - 48.3) < 0.2 && Math.abs(ee.crit - 166.4) < 0.2 && Math.abs(ee.rapport - 0.29) < 0.005);
assert.ok(Math.abs(ee.crit - RT * 0.5 * (1 / Math.sqrt(18.0) + 1 / Math.sqrt(58.5)) ** 2 * 1000) < 1e-9);

// Sentinelles des seuils des liquides (1,25 et 2)
const sent = [['eau', 'butanol', 1.04, 'ok'], ['eau', 'pentanol', 1.35, 'lim'], ['eau', 'ether', 2.68, 'non']];
for (const [s, e, r, c] of sent) { const b = bilan(s, e); assert.ok(Math.abs(b.rapport - r) < 0.01, `${s}+${e} : r = ${b.rapport}`); assert.equal(b.classe, c); }
console.log('solubiliteModele : OK');
