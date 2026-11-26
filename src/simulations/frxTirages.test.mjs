// node src/simulations/frxTirages.test.mjs
import assert from 'node:assert/strict';
import * as T from './frxTirages.js';
import * as M from './frxModele.js';
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const Fe = M.element('Fe'), Al = M.element('Al');
const somme = x => x.reduce((a, b) => a + b, 0);
// sous le seuil K : aucun atome ionisé, aucun photon X
let e = T.lancer(T.etatVide(), Fe, { E: 7.0, w: 100 }, 5000, mulberry(1)); ok(e.nIon === 0 && somme(e.h) === 0, 'sous le seuil');
// au-dessus du seuil : fractions attendues
e = T.lancer(T.etatVide(), Fe, { E: 9, w: 100 }, 20000, mulberry(2));
ok(Math.abs(e.nIon / e.nEnv - T.P_ION) < 0.012, 'ionisation ' + e.nIon / e.nEnv);
ok(Math.abs((e.nKa + e.nKb) / e.nIon - Fe.om) < 0.015, 'rendement de fluorescence ' + (e.nKa + e.nKb) / e.nIon);
ok(Math.abs(e.nKb / e.nKa - M.ratioKb(Fe)) < 0.02, 'Kβ/Kα ' + e.nKb / e.nKa);
ok(e.nAuger + e.nKa + e.nKb === e.nIon, 'bilan des voies');
// positions des pics
const imax = e.h.indexOf(Math.max(...e.h)); ok(Math.abs(T.centre(imax) - Fe.Ka) <= 0.1, 'pic principal en ' + T.centre(imax));
const iKb = e.h.indexOf(Math.max(...e.h.slice(T.indice(Fe.Kb - 0.3), T.indice(Fe.Kb + 0.3) + 1))) ; ok(e.h[iKb] > 0 && e.h[iKb] < e.h[imax] / 3, 'Kβ plus petit que Kα');
// forme : comptes ≈ comptes attendus
const att = T.attendu(Fe, { E: 9, w: 100 }, e); let g = 0;
for (let i = 0; i < T.NBINS; i++) if (att[i] > 80) { g++; ok(Math.abs(e.h[i] - att[i]) < 5 * Math.sqrt(att[i]) + 0.02 * att[i], `case ${i}`); }
ok(g >= 3, 'cases testées ' + g); ok(Math.abs(somme(att) - (e.nKa + e.nKb)) < 0.03 * (e.nKa + e.nKb), 'total attendu');
// proportionnalité à la teneur
const e10 = T.lancer(T.etatVide(), Fe, { E: 9, w: 10 }, 20000, mulberry(3)), e20 = T.lancer(T.etatVide(), Fe, { E: 9, w: 20 }, 20000, mulberry(4));
ok(Math.abs(e20.nKa / e10.nKa - 2) < 0.15, 'doubler la teneur double les coups ' + e20.nKa / e10.nKa);
// éléments légers : l'effet Auger domine
const eA = T.lancer(T.etatVide(), Al, { E: 4, w: 100 }, 20000, mulberry(5)); ok(eA.nAuger / eA.nIon > 0.94 && eA.nKa < eA.nAuger / 15, 'Auger pour Al : ' + eA.nAuger / eA.nIon);
ok(e.nIon > 0 && eA.nKa + eA.nKb < e.nKa + e.nKb, 'moins de photons X avec Al');
// plafond et texte
ok(T.lancer(e, Fe, { E: 9, w: 100 }, 100000, mulberry(6)).nEnv === T.MAX_ATOMES, 'plafond');
ok(/seuil/.test(T.texteAtome({ cible: true, ion: false }, Fe, 5)) && /Auger/.test(T.texteAtome({ cible: true, ion: true, voie: 'auger' }, Fe, 9)) && /Kα/.test(T.texteAtome({ cible: true, ion: true, voie: 'ka', Edet: 6.41 }, Fe, 9)));
{ const l = T.lancer(T.etatVide(), Fe, { E: 9, w: 100 }, 10, mulberry(7)); ok(l.lotRes.n === 10 && l.lotRes.ion === l.nIon && l.lotRes.ion >= l.lotRes.ka + l.lotRes.kb + l.lotRes.auger - 0 && l.lotRes.ka + l.lotRes.kb + l.lotRes.auger === l.lotRes.ion, 'résumé du lot'); }
console.log('Tirages sim 302 :', n, 'vérifications réussies.');
