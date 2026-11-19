import assert from 'node:assert/strict';
import * as M from './ondesCeleriteModele.js';
const pr = (a, b, t = 1e-9) => assert.ok(Math.abs(a - b) <= t, `${a} ≠ ${b}`);
// relation fondamentale
pr(M.celerite(2, 0.5), 4); pr(M.duree(3, 4), 0.75); pr(M.distance(340, 6), 2040); pr(M.profondeurEcho(1500, 0.08), 60);
// corde : le maximum passe en x à t = x/c ; le retard entre x1 et x2 vaut (x2 − x1)/c
const c = 4;
pr(M.elongation(3, 3 / c, c), M.A_BOSSE);
assert.ok(M.elongation(3, 0.2, c) < 0.01 * M.A_BOSSE);
pr(M.instantPassage(3, c) - M.instantPassage(1, c), 0.5);
pr(M.celerite(3 - 1, M.instantPassage(3, c) - M.instantPassage(1, c)), c);
// la vitesse d'un point n'est pas la célérité : elle est nulle quand la bosse est au maximum, et reste très inférieure à c × (A/W)
pr(M.vitessePoint(3, 3 / c, c), 0);
let vmax = 0; for (let t = 0; t < 2; t += 0.0005) vmax = Math.max(vmax, Math.abs(M.vitessePoint(3, t, c)));
pr(vmax, M.vitesseMax(c), 1e-3);
assert.ok(vmax < c, 'vitesse du point < célérité (A/W < 1)');
// vitesse par différence finie = dérivée analytique
const h = 1e-6; pr((M.elongation(3, 0.7 + h, c) - M.elongation(3, 0.7 - h, c)) / (2 * h), M.vitessePoint(3, 0.7, c), 1e-5);
// durée d'observation : toujours assez longue pour voir passer la bosse au capteur 2
for (const cc of [2.5, 4, 6]) for (const x2 of [2, 3, 4, 5]) assert.ok(M.dureeObservation(x2, cc) >= x2 / cc + 0.4);
// carte : durées 10,0 / 7,0 / 9,0 s pour c = 6 km/s
const S = M.stationsDe(M.E_DEPART, M.STATIONS_DEPART), dts = M.durees(M.E_DEPART, S, M.C_CARTE);
[10, 7, 9].forEach((v, i) => pr(dts[i], v, 1e-9));
const rayons = dts.map(t => M.C_CARTE * t);
rayons.forEach((r, i) => pr(r, M.STATIONS_DEPART[i].R, 1e-9));
S.forEach(s => assert.ok(M.dansCarte(s), 'station dans la carte'));
// les trois cercles se coupent en E ; les autres points candidats sont hors de E
const cand = M.candidats(S, rayons, M.E_DEPART);
S.forEach((s, i) => pr(M.dist(s, M.E_DEPART), rayons[i], 1e-9));
console.log('candidats :', cand.autres.map(p => `(${p.x.toFixed(1)} ; ${p.y.toFixed(1)})`).join(' '), 'dans carte :', cand.autres.map(M.dansCarte).join(','));
assert.ok(cand.autres.length === 3 && cand.autres.every(M.dansCarte));
// ordres de grandeur du son
assert.ok(M.MILIEUX[0].c < M.MILIEUX[1].c && M.MILIEUX[1].c < M.MILIEUX[2].c);
M.dureesCourse(100).forEach((t, i) => pr(t * M.MILIEUX[i].c, 100, 1e-9));
console.log('ondesCeleriteModele : OK');
