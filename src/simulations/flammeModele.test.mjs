// node src/simulations/flammeModele.test.mjs
import assert from 'node:assert/strict';
import * as M from './flammeModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; }; const pr = (a, b, t, m) => ok(Math.abs(a - b) <= t, `${m} : ${a} vs ${b}`);
const Na = M.element('Na'), Ca = M.element('Ca'), Cu = M.element('Cu');
pr(M.energieEV(589.0), 2.105, 0.002, 'énergie de la raie du sodium');
pr(M.pourDixMille(Na, 2500), 1.7, 0.2, 'sodium à 2500 K : environ 1,7 atome excité sur 10 000');
ok(M.pourDixMille(Na, 3000) > 4 * M.pourDixMille(Na, 2500) && M.pourDixMille(Na, 2200) < M.pourDixMille(Na, 2500), 'la fraction excitée croît très vite avec T');
ok(M.fractionExcitee(Ca, 2500) < 1e-5 && M.fractionExcitee(Cu, 2500) < 1e-7, 'Ca et Cu : quasi aucun atome excité');
ok(M.fractionExcitee(M.element('Mg'), 3000) < M.fractionExcitee(Ca, 3000), 'plus E est grande, moins il y a d’atomes excités');
for (const e of M.ELEMENTS) { ok(M.fractionExcitee(e, 3000) < 0.01, `${e.s} : le fondamental domine`); for (const f of M.FLAMMES) ok(M.absorbance(e, f.id, e.cmax) < 2 && M.absorbance(e, f.id, e.cmax) > 0, `${e.s} ${f.id} A dans la plage`); }
ok(M.beta(Ca, 'protoxyde') > 2 * M.beta(Ca, 'acetylene') && M.beta(Ca, 'acetylene') > M.beta(Ca, 'propane'), 'Ca : atomisation croît avec la température de flamme');
// linéarité à faible concentration et courbure à forte concentration
const a1 = M.absorbance(Na, 'acetylene', 0.2), a2 = M.absorbance(Na, 'acetylene', 0.4); pr(a2 / a1, 2, 0.05, 'A proportionnelle à c à faible c');
ok(M.absorbance(Na, 'acetylene', 5) < 25 * a1 * 0.95 / 1, 'courbure à forte concentration');
pr(M.emission(Na, 'acetylene', 0.001), 0.1, 0.002, 'référence : 100 unités pour 1 mg/L de Na (régime linéaire)');
ok(M.emission(Na, 'acetylene', 5) < 5 * M.emission(Na, 'acetylene', 1), 'autoabsorption en émission à forte concentration');
ok(M.emission(Na, 'protoxyde', 1) > 3 * M.emission(Na, 'acetylene', 1), 'émission très sensible à la température');
ok(M.emission(Cu, 'acetylene', 1) < 1e-3 * M.emission(Na, 'acetylene', 1), 'Cu quasi inobservable en émission');
ok(M.absorbance(Cu, 'acetylene', 1) > 0.1, 'Cu bien mesuré en absorption');
// probabilité d'absorption et tirage
pr(M.probaAbsorbe(Na, 'acetylene', 1), 1 - 10 ** -M.absorbance(Na, 'acetylene', 1), 1e-12, 'p = 1 − 10^(−A)');
let s = 123456789; const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
let tot = 0; for (let i = 0; i < 400; i++) tot += M.instantane(Na, 3000, 10000, rnd).length; pr(tot / 400, M.pourDixMille(Na, 3000), 0.8, 'instantané : moyenne');
// défi d'étalonnage
for (const m of ['emission', 'absorption']) { const d = M.tirageDefiEtalonnage(rnd, m); pr(M.concDepuisDroite(m, d.el, d.fl, d.S), d.vrai, 0.12 * d.vrai + 0.02, 'défi ' + m); ok(d.S > 0 && d.S1 > 0, 'signaux positifs'); }
ok(M.etapeDe(0) === 0 && M.etapeDe(0.3) === 1 && M.etapeDe(0.99) === 3, 'étapes du trajet');
console.log('Sim 313 modèle :', n, 'vérifications réussies.');
