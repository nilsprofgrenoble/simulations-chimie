// node src/simulations/chromoTirages.test.mjs
import assert from 'node:assert/strict';
import * as T from './chromoTirages.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const p = { lam0: 450, amax: 1, mode: 'hasard', lamChoisi: 450 };
ok(Math.abs(T.absorbanceA(450, p) - 1) < 1e-12 && Math.abs(T.transmittance(450, p) - 0.1) < 1e-12, 'A = 1 au maximum, T = 10 %');
const e = T.lancer(T.etatVide(T.sigDe(p)), p, 30000, mulberry(1));
ok(e.nEnv === 30000 && e.env.reduce((a, b) => a + b, 0) === 30000 && e.tr.reduce((a, b) => a + b, 0) + e.nAbs === e.nEnv, 'comptage');
ok(Math.abs(1 - e.nAbs / e.nEnv - T.probaTransmis(p)) < 0.006, 'proportion transmise');
ok(T.absorbanceEstimee(e, T.indice(450)) > 0.8 && T.absorbanceEstimee(e, T.indice(450)) < 1.2, 'A ≈ 1 au maximum : ' + T.absorbanceEstimee(e, T.indice(450)));
ok(T.absorbanceEstimee(e, T.indice(750)) < 0.02, 'A ≈ 0 loin de la bande');
let g = 0; for (let i = 0; i < T.NBINS; i++) if (e.env[i] > 150) { const a = T.absorbanceEstimee(e, i), b = T.absorbanceCase(p, i), Tc = T.transmittanceCase(p, i), sd = 0.434 * Math.sqrt((1 - Tc) / (Tc * e.env[i])); g++; ok(Math.abs(a - b) < 5 * sd + 0.02, 'case ' + i + ' : ' + a + ' vs ' + b + ' (sd ' + sd + ')'); }
ok(g > 100, 'cases testées ' + g);
// concentration : A double si amax double (Beer-Lambert), à faible absorbance
const pb = { ...p, amax: 0.05 }, pc = { ...p, amax: 0.1 };
ok(Math.abs(T.absorbanceA(450, pc) / T.absorbanceA(450, pb) - 2) < 1e-12, 'A proportionnelle à la concentration');
// σ choisi
const c = T.lancer(T.etatVide(T.sigDe({ ...p, mode: 'choisi' })), { ...p, mode: 'choisi', lamChoisi: 450 }, 4000, mulberry(2));
ok(c.env[T.indice(450)] === 4000 && Math.abs(c.tr[T.indice(450)] / 4000 - 0.1) < 0.02, 'λ choisi');
// changement de signature : l'état repart de zéro
ok(T.lancer(e, { ...p, amax: 2 }, 10, mulberry(3)).nEnv === 10, 'nouvel état si le réglage change');
ok(T.lancer(e, p, 100, mulberry(4)).nEnv === 30000, 'plafond');
// précision croissante
const pt = T.lancer(T.etatVide(T.sigDe(p)), p, 1500, mulberry(5));
const ecart = et => { let s = 0, k = 0; for (let i = 0; i < T.NBINS; i++) if (et.env[i] > 0) { s += Math.abs(T.absorbanceEstimee(et, i) - T.absorbanceCase(p, i)); k++; } return s / k; };
ok(ecart(e) < ecart(pt), 'le spectre se précise');
// démonstrations, domaines, énergie
const d1 = T.evenementDemo(1, p), d0 = T.evenementDemo(0, p);
ok(d1.absorbe && d1.lam === 450 && !d0.absorbe && T.transmittance(d0.lam, p) > 0.99, 'démonstrations');
ok(T.domaine(300) === 'UV' && T.domaine(500) === 'visible' && T.domaine(790) === 'proche infrarouge' && Math.abs(T.energieEV(500) - 2.486) < 1e-3, 'domaines et énergie');
ok(T.scenarioVisible(d1, 0.2) === -1 && T.scenarioVisible(d1, 0.5) === 1 && T.scenarioVisible(d0, 0.5) === 0 && /bleu/.test(T.legendePhase(d1, 0.1)) && /transition/.test(T.legendePhase(d1, 0.5)), 'scénario allumé et légende');
console.log('Tirages sim 303 :', n, 'vérifications réussies.');
