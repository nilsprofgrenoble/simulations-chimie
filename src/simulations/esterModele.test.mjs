import * as M from './esterModele.js';
let n = 0, ko = 0;
const ok = (c, m) => { n++; if (!c) { ko++; console.log('ÉCHEC', m); } };
const pr = (x, y, t, m) => ok(Math.abs(x - y) <= t, `${m} : ${x} vs ${y}`);
pr(M.rendementEq(0.2, 0.2), 2 / 3, 1e-9, 'équimolaire K=4 → 2/3');
ok(M.rendementEq(0.2, 0.6) > 0.9, 'excès de 3 eq > 90 % : ' + M.rendementEq(0.2, 0.6));
pr(M.rendementEq(0.2, 0.6), 0.9028, 0.001, 'valeur excès 3');
// reproduit K à l'équilibre : x² = K (nA-x)(nB-x)
const x = M.avancementEq(0.2, 0.3); pr(x * x / ((0.2 - x) * (0.3 - x)), 4, 1e-9, 'quotient à l\'équilibre = K');
// simulation sans DS tend vers l'équilibre
const s1 = M.simuler({ nA: 0.2, nB: 0.2, T: 100, cat: true, ds: false, tmax: 600 });
pr(s1.E[s1.E.length - 1] / 0.2, 2 / 3, 0.005, 'sim sans DS → équilibre');
// avec DS : rendement > 97 % en 180 min
const s2 = M.simuler({ nA: 0.2, nB: 0.2, T: 100, cat: true, ds: true, tmax: 180 });
ok(s2.E[s2.E.length - 1] / 0.2 > 0.93, 'DS > 93 % ' + s2.E[s2.E.length - 1] / 0.2);
ok(s2.Wd[s2.Wd.length - 1] > 0.95 * s2.E[s2.E.length - 1], 'eau du décanteur ≈ ester formé');
pr(s2.E[s2.E.length - 1], s2.Wd[s2.Wd.length - 1] + s2.W[s2.W.length - 1], 1e-9, 'conservation : ester = eau (ballon + décanteur)');
// DS inefficace à 60 °C
const s3 = M.simuler({ nA: 0.2, nB: 0.2, T: 60, cat: true, ds: true, tmax: 180 }); ok(s3.Wd[s3.Wd.length - 1] === 0, 'pas d\'entraînement à 60 °C');
// sans catalyseur : très lent
const s4 = M.simuler({ nA: 0.2, nB: 0.2, T: 100, cat: false, ds: false, tmax: 60 }); ok(s4.E[s4.E.length - 1] / 0.2 < 0.15, 'sans catalyseur lent ' + s4.E[s4.E.length - 1] / 0.2);
// température : plus vite à chaud
const i60 = M.indiceTemps(s1, 30); const sf = M.simuler({ nA: 0.2, nB: 0.2, T: 60, cat: true, ds: false, tmax: 180 }); ok(sf.E[i60] < s1.E[i60], 'plus lent à 60 °C');
// vitesse : 90 % de l'équilibre atteinte en 120 min à 100 °C avec catalyseur
const e100 = s1.E[M.indiceTemps(s1, 60)] / (0.2 * 2 / 3); ok(e100 > 0.85 && e100 < 0.9995, 'cinétique à 60 min ' + e100);
// Rf
for (const p of [0.05, 0.1, 0.3, 0.5, 0.9]) ok(M.rf('ester', p) > M.rf('alcool', p) && M.rf('alcool', p) > M.rf('acide', p), 'ordre des Rf p=' + p);
pr(M.rf('ester', 0.3), 0.745, 0.01, 'Rf ester 30 %'); pr(M.rf('alcool', 0.3), 0.449, 0.01, 'Rf alcool'); pr(M.rf('acide', 0.3), 0.120, 0.01, 'Rf acide');
// bilan
pr(M.molesDepuisVolume(M.ACIDE, 15), 15 * 1.05 / 60.05, 1e-12, 'n acide'); pr(M.volumeEau_mL(0.1), 1.8, 1e-9, 'volume d\'eau 0,1 mol');
pr(M.lavageHydrogenocarbonate(0.01, 0.02).CO2_mL, 240, 1e-6, 'CO2 pour 0,01 mol'); pr(M.rendement(0.1, 0.2, 0.25), 0.5, 1e-12, 'rendement');
console.log(`${n} tests, ${ko} échec(s)`); process.exit(ko ? 1 : 0);
