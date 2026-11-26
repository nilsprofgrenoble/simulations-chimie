// node src/simulations/hookTirages.test.mjs
import assert from 'node:assert/strict';
import * as T from './hookTirages.js';
import * as M from './hookModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const mol = M.MOLECULES.propanone;
const e = T.lancer(T.etatVide(), mol, { mode: 'hasard' }, 30000, mulberry(1));
ok(e.nEnv === 30000 && e.env.reduce((a, b) => a + b, 0) === 30000, 'comptage'); ok(e.tr.reduce((a, b) => a + b, 0) + e.nAbs === e.nEnv, 'transmis + absorbés = envoyés');
ok(Math.abs(1 - e.nAbs / e.nEnv - T.probaTransmis(mol, { mode: 'hasard' })) < 0.006, 'proportion transmise ' + (1 - e.nAbs / e.nEnv));
// bande C=O : cases proches de 1715 cm⁻¹ très absorbantes ; zone 2200–2500 quasi transparente
const iCO = T.indice(1715), iVide = T.indice(2400);
ok(T.estimee(e, iCO) < 40 && T.estimee(e, iVide) > 94, 'C=O ' + T.estimee(e, iCO) + ' / transparent ' + T.estimee(e, iVide));
let g = 0; for (let i = 0; i < T.NBINS; i++) if (e.env[i] > 150) { g++; ok(Math.abs(T.estimee(e, i) - T.prevue(mol, i)) < 6 * 50 / Math.sqrt(e.env[i]) / 2 + 1, 'case ' + i); }
ok(g > 100, 'cases testées ' + g);
// σ choisi : tous les photons dans la même case ; transmittance observée = T(σ)
const c = T.lancer(T.etatVide(), mol, { mode: 'choisi', sigma: 1715 }, 5000, mulberry(2)); const ic = T.indice(1715);
ok(c.env[ic] === 5000 && Math.abs(c.tr[ic] / 5000 - M.transmittance(mol.bandes, 1715)) < 0.02, 'σ choisi');
// plus de photons → estimation plus proche (hors bande)
const pt = T.lancer(T.etatVide(), mol, { mode: 'hasard' }, 700, mulberry(3));
const ecart = et => { let s = 0, k = 0; for (let i = 0; i < T.NBINS; i++) if (et.env[i] > 0) { s += Math.abs(T.estimee(et, i) - T.prevue(mol, i)); k++; } return s / k; };
ok(ecart(e) < ecart(pt), 'le spectre se précise : ' + ecart(pt).toFixed(1) + ' → ' + ecart(e).toFixed(1));
ok(T.lancer(e, mol, { mode: 'hasard' }, 100, mulberry(4)).nEnv === 30000, 'plafond');
ok(T.lancer(T.etatVide(), mol, { mode: 'hasard' }, 10, mulberry(5)).lotRes.n === 10, 'résumé du lot');
// démonstration
const d1 = T.evenementDemo(1, mol), d0 = T.evenementDemo(0, mol);
ok(d1.absorbe && d1.sigma === 1715 && T.nomBande(d1.bande) === 'C=O', 'démo absorbé'); ok(!d0.absorbe && M.transmittance(mol.bandes, d0.sigma) > 0.95, 'démo transmis ' + d0.sigma);
ok(T.scenarioVisible(d1, 0.2) === -1 && T.scenarioVisible(d1, 0.5) === 1 && T.scenarioVisible(d0, 0.5) === 0 && T.scenarioVisible(null, 1) === -1, 'scénario allumé');
ok(/absorbé/.test(T.texteEvenement(d1)) && /transmis/.test(T.texteEvenement(d0)) && /C=O/.test(T.legendePhase(d1, 0.5)), 'textes');
console.log('Tirages sim 304 :', n, 'vérifications réussies.');
