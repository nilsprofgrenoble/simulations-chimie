import * as M from './pointageModele.js';
import assert from 'node:assert';
const pr = (a, b, t, msg) => assert.ok(Math.abs(a - b) <= t * Math.max(1, Math.abs(b)), `${msg} : ${a} vs ${b}`);
const tau = 1 / 30, film = M.filmPendule({ L: 0.6, theta0: 35, tau, n: 48, amort: 0 });
const pts = M.arrondiPointage(film);
const B = M.bilan(pts, 0.020, tau);
// sans amortissement : Em ≈ constante (à l'incertitude de pointage près, et à l'erreur de la différence centrée)
const Em0 = 0.020 * 9.8 * 0.6 * (1 - Math.cos(35 * M.RAD));
B.forEach(b => pr(b.Em, Em0, 0.06, 'Em constante'));
B.slice(1).forEach(b => assert.ok(M.compatibles(B[0], b), 'compatibles sans amortissement'));
// avec amortissement : Em diminue
const amort = M.bilan(M.arrondiPointage(M.filmPendule({ amort: 0.35, tau })), 0.020, tau);
assert.ok(amort[amort.length - 1].Em < 0.8 * amort[0].Em, 'perte avec amortissement');
// échelle et conversion
pr(M.echelle(0.5, 200), 0.0025, 1e-12, 'échelle');
const c = M.pxVersMetres({ px: 300, py: 100 }, { echelle: 0.0025, origine: [100, 300] });
pr(c.x, 0.5, 1e-12, 'x'); pr(c.y, 0.5, 1e-12, 'y');
// vitesse centrée : mouvement uniforme
const u = [0, 1, 2].map(i => ({ x: 0.1 * i, y: 0 })); pr(M.vitesse(u, 1, 0.5), 0.2, 1e-12, 'v');
// CSV Fizziq : en-tête de métadonnées puis #,t,x,y
const csv = '# Fizziq export\nfoo;bar\n#,t,x,y\n0,0.000,0.10,0.05\n1,0.033,0.11,0.06\n2,0.066,0,12,0,07\n';
let r = M.lireCSV('#,t,x,y\n0,0.000,0.10,0.05\n1,0.033,0.11,0.06\n'); assert.equal(r.length, 2); pr(r[1].t, 0.033, 1e-9, 'csv t');
r = M.lireCSV('t;x;y\n0;0,10;0,05\n0,033;0,11;0,06\n'); assert.equal(r.length, 2); pr(r[1].x, 0.11, 1e-9, 'csv virgule');
pr(M.pasDeTemps(r), 0.033, 1e-9, 'pas');
console.log('pointageModele : tous les tests passent');
