import * as M from './energieModele.js';
import assert from 'node:assert';
const pr = (a, b, t, msg) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${msg} : ${a} vs ${b}`);
// sans frottement : Em constante, Ec = Em0 − Epp, arrivée à la même hauteur de l'autre côté
let T = M.trajet({ m: 0.2, x0: 1, f: 0 });
pr(T.Em0, 0.2 * 9.8 * 0.5, 1e-9, 'Em0');
T.pts.forEach(p => pr(p.Ec + p.Epp, T.Em0, 1e-9, 'Em constante'));
pr(T.hFinal, 0.5, 2e-3, 'même hauteur');
pr(T.EcBas, T.Em0, 1e-6, 'Ec bas = Em0');
pr(T.vBas, Math.sqrt(2 * 0.98 / 0.2), 1e-6, 'v bas');
pr(T.sBas, 1.1478, 1e-3, 'longueur jusqu’au bas');
// avec frottement : Em diminue de f·s ; z final = z0 − f s /(m g)
T = M.trajet({ m: 0.2, x0: 1, f: 0.3 });
pr(T.Em0 - T.EmFinal, T.pertes, 1e-9, 'pertes');
pr(T.hFinal, M.hauteurFinale({ m: 0.2, z0: 0.5, f: 0.3, s: T.sFinal }), 2e-3, 'h finale');
assert.ok(T.hFinal < 0.5);
pr(M.frottementDeduit({ m: 0.2, z0: 0.5, z1: T.hFinal, s: T.sFinal }), 0.3, 2e-3, 'f retrouvé');
pr(T.EcBas, 0.98 - 0.3 * T.sBas, 1e-6, 'Ec bas avec frottement');
// frottement fort : la bille s'arrête avant le bas
T = M.trajet({ m: 0.2, x0: 1, f: 1 });
assert.ok(T.bas === null || T.EcBas >= 0);
// proportionnalité
pr(M.ecin(2, 6), 4 * M.ecin(2, 3), 1e-12, 'v×2 → Ec×4');
console.log('energieModele : tous les tests passent');
