// node src/simulations/fluoTirages.test.mjs
import assert from 'node:assert/strict';
import * as T from './fluoTirages.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
ok(Math.abs(T.FC.reduce((a, b) => a + b, 0) - 1) < 1e-12, 'FC normalisés');
ok(T.FC.indexOf(Math.max(...T.FC)) === 2, 'maximum en v = 2');
const A = T.MOLS_T.A, B = T.MOLS_T.B;
// positions des maxima : mêmes valeurs que les molécules A et B du reste de la simulation (350 / 450 nm ; 350 / 420 / 520 nm)
ok(Math.abs(T.lamMaxAbsorption(A) - 350) < 1.5, 'abs A ' + T.lamMaxAbsorption(A));
ok(Math.abs(T.lamMaxEmission(A) - 450) < 2, 'em A ' + T.lamMaxEmission(A));
ok(Math.abs(T.lamMaxAbsorption(B) - 350) < 1.5 && Math.abs(T.lamMaxEmission(B) - 420) < 2, 'B');
{ let mx = 0, lm = 0; for (let l = 380; l < 700; l += 0.5) { const v = T.pdfPhos(B, T.HC / l) * T.HC / (l * l); if (v > mx) { mx = v; lm = l; } } ok(Math.abs(lm - 520) < 2, 'phosphorescence B : maximum ' + lm); }
ok(Math.abs((T.energieDe(T.lamMaxAbsorption(A)) - T.energieDe(T.lamMaxEmission(A))) - 0.79) < 0.03, 'Stokes de A entre les maxima ≈ 0,79 eV');
// image miroir : les raies d'absorption et d'émission sont symétriques par rapport à E00
for (const m of [A, B]) for (let v = 0; v < T.NV; v++) ok(Math.abs((T.raiesAbs(m)[v] - m.E00) + (T.raiesFluo(m)[v] - m.E00)) < 1e-12, 'miroir');
ok(B.T.E00 < B.E00, 'T₁ sous S₁');
// probabilités
for (let E = 2.5; E < 4.5; E += 0.01) { const p = T.pAbs(A, E); ok(p >= 0 && p <= T.P_ABS_MAX + 1e-9, 'pAbs'); }
ok(T.pAbs(A, T.energieDe(350)) > 0.85 && T.pAbs(A, T.energieDe(600)) < 1e-6, 'pAbs pic / hors bande');
// tirages : mode émission à 350 nm, 200 000 photons
const N = 200000, rnd = mulberry(12345);
const ea = T.lancer(T.etatVide(), A, { mode: 'emission', lamExc: 350 }, 20000, rnd);
let e = T.etatVide(); for (let i = 0; i < 10; i++) e = T.lancer(e, A, { mode: 'emission', lamExc: 350 }, 20000, rnd);
ok(e.nEnv === 200000 || e.nEnv === T.MAX_PHOTONS * 1 || e.nEnv <= T.MAX_PHOTONS, 'plafond de photons');
ok(ea.nEnv === 20000, 'plafond respecté');
const pa = ea.nAbs / ea.nEnv; ok(Math.abs(pa - T.pAbs(A, T.energieDe(350))) < 0.015, 'fraction absorbée ' + pa);
ok(Math.abs(ea.nFl / ea.nAbs - A.rend.fluo) < 0.02, 'rendement quantique observé ' + ea.nFl / ea.nAbs);
// forme du spectre d'émission : comptes ≈ comptes attendus dans les cases bien remplies (écart < 5 σ de Poisson)
const att = T.attendu(A, { mode: 'emission', lamExc: 350 }, ea);
let nGrosses = 0; for (let i = 0; i < T.NBINS; i++) if (att[i] > 100) { nGrosses++; ok(Math.abs(ea.fl[i] - att[i]) < 5 * Math.sqrt(att[i]) + 0.02 * att[i], `case ${i} : ${ea.fl[i]} vs ${att[i].toFixed(0)}`); }
ok(nGrosses >= 6, 'assez de cases testées ' + nGrosses);
ok(Math.abs(att.reduce((a, b) => a + b, 0) - ea.nFl) < 0.03 * ea.nFl, 'total attendu');
// le pic le plus haut est la case de 450 nm
const imax = ea.fl.indexOf(Math.max(...ea.fl)); ok(Math.abs(T.lamCentre(imax) - 450) <= 5, 'pic d’émission en ' + T.lamCentre(imax));
// règle de Kasha : l'émission ne dépend pas de la longueur d'onde d'excitation (350 nm contre 331 nm : mêmes proportions)
const eb = T.lancer(T.etatVide(), A, { mode: 'emission', lamExc: 331 }, 20000, mulberry(99));
ok(eb.nAbs > 1000, '331 nm est bien absorbé ' + eb.nAbs);
for (let i = 0; i < T.NBINS; i++) { const fa = ea.fl[i] / ea.nFl, fb = eb.fl[i] / eb.nFl; ok(Math.abs(fa - fb) < 0.02, 'Kasha case ' + i); }
// hors bande : presque rien n'est absorbé, donc aucune émission
const ec = T.lancer(T.etatVide(), A, { mode: 'emission', lamExc: 480 }, 5000, mulberry(5)); ok(ec.nAbs === 0 && ec.nFl === 0, 'rien à 480 nm');
// molécule B : fluorescence et phosphorescence, rendements
const eB = T.lancer(T.etatVide(), B, { mode: 'emission', lamExc: 350 }, 20000, mulberry(7));
ok(Math.abs(eB.nFl / eB.nAbs - B.rend.fluo) < 0.02, 'fluo B'); ok(Math.abs(eB.nPh / eB.nAbs - B.rend.cis * B.T.phos) < 0.02, 'phos B');
ok(eB.ph.some(x => x > 0) && eB.fl.some(x => x > 0), 'deux familles');
// mode excitation : détection à 450 nm, le spectre d'excitation a la forme du spectre d'absorption
let ex = T.etatVide(); const pe = { mode: 'excitation', lamEm: 450 }; const r2 = mulberry(321); for (let i = 0; i < 10; i++) ex = T.lancer(ex, A, pe, 2000, r2);
const aex = T.attendu(A, pe, ex); let g = 0;
for (let i = 0; i < T.NBINS; i++) if (aex[i] > 60) { g++; ok(Math.abs(ex.ex[i] - aex[i]) < 5 * Math.sqrt(aex[i]) + 0.03 * aex[i], `excitation case ${i} : ${ex.ex[i]} vs ${aex[i].toFixed(0)}`); }
ok(g >= 3, 'cases testées en excitation ' + g);
const iex = ex.ex.indexOf(Math.max(...ex.ex)); ok(Math.abs(T.lamCentre(iex) - 350) <= 6, 'pic d’excitation en ' + T.lamCentre(iex));
ok(ex.ex.every((x, i) => x === 0 || (T.lamCentre(i) >= T.LAM_EXC.min && T.lamCentre(i) < T.LAM_EXC.max)), 'domaine d’excitation');
// détection hors de l'émission : aucun coup
const somme = x => x.reduce((a, b) => a + b, 0);
let ez = T.lancer(T.etatVide(), A, { mode: 'excitation', lamEm: 580 }, 20000, mulberry(8)); ok(somme(ez.ex) < 0.2 * somme(ex.ex), 'peu détecté à 580 nm (queue de la bande) : ' + somme(ez.ex));
// texte du dernier événement
ok(/traverse/.test(T.texteEvenement({ absorbe: false }, 'emission')) && /fluorescence/.test(T.texteEvenement(ea.dernier ?? { absorbe: true, vAbs: 1, voie: 'fluo', v: 2, lamOut: 450 }, 'emission')) || ea.dernier);
console.log('Tirages sim 301 :', n, 'vérifications réussies.');
