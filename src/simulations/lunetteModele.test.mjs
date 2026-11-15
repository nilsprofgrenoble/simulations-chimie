import * as M from './lunetteModele.js';
let n = 0; const ok = (c, m) => { n++; if (!c) { console.error('ERR', m); process.exit(1); } };
const pr = (a, b, t = 1e-9) => Math.abs(a - b) <= t * Math.max(1, Math.abs(b));
ok(pr(M.dAfocal(800, 20), 820), 'd afocal');
ok(M.afocale(820, 800, 20) && M.net(820, 800, 20), 'afocal net');
ok(Math.abs(M.vergenceSortie(820, 800, 20)) < 1e-9, 'V=0');
ok(!M.net(820, 800, 20, 'myope'), 'afocal pas net pour myope');
const dm = M.dMyope(800, 20); ok(dm < 820, 'rapprocher'); ok(M.net(dm, 800, 20, 'myope') && !M.afocale(dm, 800, 20), 'myope net');
ok(pr(M.posA2(dm, 800, 20), -M.PR, 1e-9), 'image à PR : ' + M.posA2(dm, 800, 20));
ok(M.natureA2(dm, 800, 20) === 'virtuelle' && M.natureA2(830, 800, 20) === 'reelle', 'natures');
ok(pr(M.tailleA1B1(800, 2), 1.6) && pr(M.theta2(1.6, 20), 0.08) && pr(M.grossissement(800, 20), 40), 'valeurs');
ok(pr(M.theta2(M.tailleA1B1(800, 2), 20) / 0.002, M.grossissement(800, 20)), 'G = θ2/θ0');
// changer d'oculaire sans toucher : plus au point
ok(!M.afocale(820, 800, 10) && Math.abs(M.vergenceSortie(820, 800, 10) - 1000 * (1 / 10 - 1 / 20)) < 1e-9, 'oculaire changé');
ok(M.afocale(820.3, 800, 20) && !M.afocale(821, 800, 20), 'tolérance 0,4 mm pour f2=20');
ok(M.visibleOeilNu(0.5) === true && M.visibleOeilNu(0.2) === false, 'visible');
console.log(`lunetteModele : tous les tests passent (${n})`);
